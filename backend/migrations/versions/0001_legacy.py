"""Create or safely adopt the original characters/appearances schema."""
from alembic import op
import sqlalchemy as sa

revision = "0001_legacy"
down_revision = None
branch_labels = None
depends_on = None

CHARACTER_FIELDS = {"id", "slug", "name", "shortName", "color", "status", "arc", "role", "occupation", "race", "avatarInitial", "biography", "abilities", "relationships"}
APPEARANCE_FIELDS = {"id", "character_id", "episode", "summary"}


def upgrade():
    inspector = sa.inspect(op.get_bind())
    existing = set(inspector.get_table_names()) & {"characters", "appearances"}
    if existing:
        if existing != {"characters", "appearances"}:
            raise RuntimeError("Legacy adoption refused: both characters and appearances tables are required.")
        for table, expected in [("characters", CHARACTER_FIELDS), ("appearances", APPEARANCE_FIELDS)]:
            if {column["name"] for column in inspector.get_columns(table)} != expected:
                raise RuntimeError(f"Legacy adoption refused: unexpected {table} columns. Back up and inspect the database.")
        return
    op.create_table("characters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("shortName", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        *[sa.Column(field, sa.String(), nullable=True) for field in ["arc", "role", "occupation", "race", "avatarInitial"]],
        *[sa.Column(field, sa.Text(), nullable=True) for field in ["biography", "abilities", "relationships"]])
    op.create_index("ix_characters_slug", "characters", ["slug"], unique=True)
    op.create_table("appearances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("characters.id"), nullable=False),
        sa.Column("episode", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True))


def downgrade():
    raise RuntimeError("Destructive downgrade refused. Restore an explicit database backup instead.")
