"""Explicit, transactional initial import. Never called by application startup."""
import argparse
import json
from pathlib import Path
from sqlalchemy import select
from .config import Settings
from .database import build_engine, build_session_factory
from .models import Character
from .schemas import CharacterCreate
from .services import apply_payload


def seed_database(db, source: Path) -> int:
    if db.scalar(select(Character.id).limit(1)) is not None:
        raise ValueError("Database is not empty; seed refuses to overwrite or merge existing lore.")
    document = json.loads(source.read_text(encoding="utf-8"))
    payloads = []
    for item in document["characters"]:
        data = {key: value for key, value in item.items() if key in CharacterCreate.model_fields}
        data.setdefault("race", None)
        payloads.append(CharacterCreate.model_validate(data))
    if not payloads:
        raise ValueError("Seed file has no characters")
    if len({item.slug for item in payloads}) != len(payloads):
        raise ValueError("Seed file contains duplicate slugs")
    try:
        for payload in payloads:
            character = Character(version=1)
            apply_payload(character, payload)
            db.add(character)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return len(payloads)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, required=True, help="Explicit path to wiki_data.json")
    arguments = parser.parse_args()
    engine = build_engine(Settings.from_env().database_url)
    try:
        with build_session_factory(engine)() as db:
            count = seed_database(db, arguments.file)
        print(f"Imported {count} characters. Startup will never reseed them.")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
