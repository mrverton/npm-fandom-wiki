"""Read-only deployment preflight. Never prints connection strings or lore."""
import hashlib
import json
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import NullPool
from .config import Settings


def snapshot(connection):
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    rows = {}
    for table in ("characters", "appearances"):
        if table in tables:
            rows[table] = [dict(row) for row in connection.execute(
                text(f'SELECT * FROM "{table}" ORDER BY id')).mappings()]
    return rows


def fingerprint(rows):
    return hashlib.sha256(json.dumps(rows, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode()).hexdigest()


def describe(connection):
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    rows = snapshot(connection)
    return {
        "dialect": connection.dialect.name,
        "revision": list(connection.execute(text("SELECT version_num FROM alembic_version")).scalars())
        if "alembic_version" in tables else [],
        "columns": {table: [column["name"] for column in inspector.get_columns(table)] for table in rows},
        "counts": {table: len(items) for table, items in rows.items()},
        "fingerprint": fingerprint(rows),
    }


def main():
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, poolclass=NullPool)
    try:
        with engine.connect() as connection:
            if engine.dialect.name == "postgresql":
                connection.execute(text("SET TRANSACTION READ ONLY"))
            print("DATABASE_PREFLIGHT " + json.dumps(describe(connection), sort_keys=True))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
