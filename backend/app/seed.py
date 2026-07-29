"""
Заполняет базу данных начальными данными персонажей — теми же, что сейчас
лежат в src/data/wiki_data.json на фронтенде. Запускается один раз
автоматически при старте сервера, если таблица characters ещё пустая.
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from . import models

# Путь к существующему JSON с лором (../../src/data/wiki_data.json от backend/app)
WIKI_JSON_PATH = Path(__file__).resolve().parent.parent.parent / "src" / "data" / "wiki_data.json"


def seed_if_empty(db: Session):
    already_has_data = db.query(models.Character).first() is not None
    if already_has_data:
        return

    if not WIKI_JSON_PATH.exists():
        print(f"[seed] Файл {WIKI_JSON_PATH} не найден, пропускаю заполнение.")
        return

    with open(WIKI_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for char in data.get("characters", []):
        character = models.Character(
            slug=char["slug"],
            name=char["name"],
            shortName=char["shortName"],
            color=char.get("color", "qzero"),
            status=char.get("status", "Неизвестно"),
            arc=char.get("arc", ""),
            role=char.get("role", ""),
            occupation=char.get("occupation", ""),
            race=char.get("race"),
            avatarInitial=char.get("avatarInitial", "?"),
            biography=char.get("biography", ""),
            abilities=json.dumps(char.get("abilities", []), ensure_ascii=False),
            relationships=json.dumps(char.get("relationships", []), ensure_ascii=False),
        )
        for app_item in char.get("appearances", []):
            character.appearances.append(
                models.Appearance(
                    episode=app_item.get("episode", ""),
                    summary=app_item.get("summary", ""),
                )
            )
        db.add(character)

    db.commit()
    print(f"[seed] Загружено персонажей: {len(data.get('characters', []))}")
