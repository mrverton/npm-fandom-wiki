"""Run explicit migrations against configured DB; SQLite DDL is transactional."""
from alembic import context
from sqlalchemy import create_engine, event, pool
from app.config import Settings
from app.database import Base
from app import models  # noqa: F401 — register ORM metadata

config = context.config
target_metadata = Base.metadata


def run_migrations():
    if context.is_offline_mode():
        raise RuntimeError("Offline migrations are unsupported: existing lore must be validated before schema changes.")
    database_url = config.attributes.get("database_url") or Settings.from_env().database_url
    engine = create_engine(database_url, poolclass=pool.NullPool)
    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")
        def sqlite_transaction_control(connection, _record):
            connection.isolation_level = None
            # Batch rebuilds preserve children, then validate all FKs before commit.
            connection.execute("PRAGMA foreign_keys=OFF")

        @event.listens_for(engine, "begin")
        def sqlite_begin(connection):
            connection.exec_driver_sql("BEGIN")
    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata,
                              render_as_batch=engine.dialect.name == "sqlite", transaction_per_migration=False,
                              transactional_ddl=True)
            with context.begin_transaction():
                context.run_migrations()
                if engine.dialect.name == "sqlite" and connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall():
                    raise RuntimeError("Migration rejected: orphan appearances found; restore or repair the backup explicitly.")
    finally:
        engine.dispose()


run_migrations()
