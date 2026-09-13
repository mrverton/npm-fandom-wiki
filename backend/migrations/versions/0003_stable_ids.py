"""Never reuse deleted character IDs on SQLite (PostgreSQL already uses sequences)."""
from alembic import op

revision = "0003_stable_ids"
down_revision = "0002_contract"
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name == "sqlite":
        # The migration environment disables foreign keys for the rebuild and
        # verifies them transactionally before commit; children retain their IDs.
        with op.batch_alter_table("characters", recreate="always",
                                  table_kwargs={"sqlite_autoincrement": True}):
            pass


def downgrade():
    raise RuntimeError("ID reuse downgrade refused. Restore an explicit database backup instead.")
