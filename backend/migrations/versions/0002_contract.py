"""Validate legacy lore; add version checks, nullability, constraints and FK index."""
import json
from alembic import op
import sqlalchemy as sa
from pydantic import ValidationError
from app.schemas import CharacterCreate

revision = "0002_contract"
down_revision = "0001_legacy"
branch_labels = None
depends_on = None


def validate_legacy(bind):
    characters = list(bind.execute(sa.text("SELECT * FROM characters")).mappings())
    appearances = list(bind.execute(sa.text("SELECT * FROM appearances ORDER BY id")).mappings())
    known_ids, slugs = set(), set()
    for row in characters:
        if type(row["id"]) is not int or row["id"] <= 0 or row["slug"] in slugs:
            raise RuntimeError("Migration refused: invalid IDs or duplicate slugs in legacy data.")
        known_ids.add(row["id"])
        slugs.add(row["slug"])
        data = {key: value for key, value in row.items() if key != "id"}
        try:
            data["abilities"] = json.loads(data["abilities"])
            data["relationships"] = json.loads(data["relationships"])
            data["appearances"] = [{"episode": item["episode"], "summary": item["summary"]}
                                   for item in appearances if item["character_id"] == row["id"]]
            validated = CharacterCreate.model_validate(data)
            if validated.model_dump() != data:
                raise ValueError("whitespace normalization would modify lore")
        except (ValidationError, ValueError, TypeError):
            raise RuntimeError(f"Migration refused: character id={row['id']} violates the new contract. Back up and repair explicitly; no lore was changed.") from None
    if any(item["character_id"] not in known_ids or item["id"] <= 0 for item in appearances):
        raise RuntimeError("Migration refused: invalid or orphan appearances.")


def upgrade():
    bind = op.get_bind()
    validate_legacy(bind)
    with op.batch_alter_table("characters") as batch:
        batch.add_column(sa.Column("version", sa.Integer(), server_default="1", nullable=False))
        for field in ["arc", "role", "occupation", "avatarInitial", "biography", "abilities", "relationships"]:
            batch.alter_column(field, existing_type=sa.Text() if field in {"biography", "abilities", "relationships"} else sa.String(), nullable=False)
        batch.create_check_constraint("ck_characters_slug_length", "length(slug) BETWEEN 1 AND 80")
        batch.create_check_constraint("ck_characters_name_length", "length(trim(name)) BETWEEN 1 AND 160")
        batch.create_check_constraint("ck_characters_short_name_length", 'length(trim("shortName")) BETWEEN 1 AND 80')
        batch.create_check_constraint("ck_characters_version_positive", "version > 0")
        batch.create_check_constraint("ck_characters_color", "color IN ('verton','qzero','cortex','terton')")
        batch.create_check_constraint("ck_characters_status", "status IN ('Жив','Жива','Мертв','Неизвестно','Связь потеряна')")
    inspector = sa.inspect(bind)
    slug_indexes = inspector.get_indexes("characters")
    if not any(item["unique"] and item["column_names"] == ["slug"] for item in slug_indexes):
        op.create_index("ix_characters_slug", "characters", ["slug"], unique=True)
    foreign_keys = inspector.get_foreign_keys("appearances")
    convention = {"fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"}
    with op.batch_alter_table("appearances", naming_convention=convention) as batch:
        batch.alter_column("summary", existing_type=sa.Text(), nullable=False)
        batch.create_check_constraint("ck_appearances_episode_length", "length(trim(episode)) BETWEEN 1 AND 200")
        for foreign in foreign_keys:
            batch.drop_constraint(foreign["name"] or "fk_appearances_character_id_characters", type_="foreignkey")
        batch.create_foreign_key("fk_appearances_character", "characters", ["character_id"], ["id"], ondelete="CASCADE")
        batch.create_index("ix_appearances_character_id", ["character_id"])


def downgrade():
    raise RuntimeError("Contract downgrade refused. Restore an explicit database backup instead.")
