"""Explicit PostgreSQL rollout: locked snapshot, private backup, Alembic, verification.

Default is a dry run that rolls back all changes. Never seeds or repairs lore.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool
from .config import Settings
from .db_inspect import describe, fingerprint, snapshot

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


def migrate_and_verify(connection, before):
    config = Config(str(ALEMBIC_INI))
    config.attributes["connection"] = connection
    command.upgrade(config, "head")
    after = snapshot(connection)
    comparable = {table: [{key: row[key] for key in original} for original, row in zip(records, after[table])]
                  for table, records in before.items()}
    if comparable != before or any(len(after[table]) != len(rows) for table, rows in before.items()):
        raise RuntimeError("Migration changed existing rows; refusing commit.")
    if any(type(row["version"]) is not int or row["version"] < 1 for row in after["characters"]):
        raise RuntimeError("Migration produced invalid versions; refusing commit.")
    return describe(connection)


def backup(connection, before):
    # Names are generated internally. No URL, user input, or credentials enter SQL.
    schema = "npm_backup_" + datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    connection.execute(text(f'REVOKE ALL ON SCHEMA "{schema}" FROM PUBLIC'))
    for table in ("characters", "appearances"):
        connection.execute(text(f'CREATE TABLE "{schema}"."{table}" AS SELECT * FROM public."{table}"'))
    connection.execute(text(f'CREATE TABLE "{schema}".manifest (created_at timestamptz NOT NULL DEFAULT now(), fingerprint text NOT NULL, schema_state jsonb NOT NULL)'))
    connection.execute(text(f'INSERT INTO "{schema}".manifest (fingerprint, schema_state) VALUES (:fingerprint, CAST(:state AS jsonb))'),
                       {"fingerprint": fingerprint(before), "state": json.dumps(describe(connection))})
    # Supabase default table grants must not make backups accessible to API roles.
    for role in ("PUBLIC", "anon", "authenticated"):
        if role == "PUBLIC" or connection.execute(text("SELECT 1 FROM pg_roles WHERE rolname=:role"), {"role": role}).first():
            connection.execute(text(f'REVOKE ALL ON ALL TABLES IN SCHEMA "{schema}" FROM {role}'))
    return schema


def rollout(database_url, expected_fingerprint, apply=False):
    engine = create_engine(database_url, poolclass=NullPool, connect_args={"connect_timeout": 10})
    try:
        if engine.dialect.name != "postgresql":
            raise RuntimeError("This release command requires the existing production PostgreSQL database.")
        with engine.connect() as connection:
            transaction = connection.begin()
            try:
                connection.execute(text("SET LOCAL lock_timeout = '5s'"))
                connection.execute(text("SET LOCAL statement_timeout = '60s'"))
                connection.execute(text("LOCK TABLE public.characters, public.appearances IN ACCESS EXCLUSIVE MODE"))
                before = snapshot(connection)
                state = describe(connection)
                head = ScriptDirectory.from_config(Config(str(ALEMBIC_INI))).get_current_head()
                if state["revision"] == [head]:
                    transaction.rollback()
                    return {"status": "already_current", "database": state}
                if fingerprint(before) != expected_fingerprint:
                    raise RuntimeError("Database changed since inspection; inspect again before migration.")
                backup_schema = backup(connection, before)
                result = migrate_and_verify(connection, before)
                if apply:
                    transaction.commit()
                else:
                    transaction.rollback()
                return {"status": "applied" if apply else "dry_run_rolled_back",
                        "preserved": True, "backup_schema": backup_schema if apply else None, "database": result}
            except Exception:
                transaction.rollback()
                raise
    finally:
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expected-fingerprint", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        result = rollout(Settings.from_env().database_url, args.expected_fingerprint, args.apply)
        print("DATABASE_ROLLOUT " + json.dumps(result, sort_keys=True))
    except SQLAlchemyError as error:
        # SQL errors may include private query parameters; print only the category.
        print("DATABASE_ROLLOUT_FAILED " + type(error).__name__, file=sys.stderr)
        sys.exit(1)
    except (RuntimeError, ValueError) as error:
        print("DATABASE_ROLLOUT_FAILED " + str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
