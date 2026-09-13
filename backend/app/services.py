"""Character reads and atomic writes. HTTP/Telegram details stay outside."""
import json
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from .exceptions import ApiError
from .models import Appearance, Character
from .schemas import CharacterCreate, CharacterUpdate


def check_database(connection):
    """Check both tables and all required columns, without changing any data."""
    connection.execute(select(*Character.__table__.columns).limit(1))
    connection.execute(select(*Appearance.__table__.columns).limit(1))


def serialize_character(character: Character) -> dict:
    result = {field: getattr(character, field) for field in CharacterCreate.model_fields
              if field not in {"abilities", "relationships", "appearances"}}
    result.update(id=character.id, version=character.version,
                  abilities=json.loads(character.abilities),
                  relationships=json.loads(character.relationships),
                  appearances=[{"id": item.id, "episode": item.episode, "summary": item.summary}
                               for item in character.appearances])
    return result


def list_characters(db: Session) -> list[dict]:
    query = select(Character).options(selectinload(Character.appearances)).order_by(Character.id)
    return [serialize_character(character) for character in db.scalars(query).all()]


def find_character(db: Session, character_id: int) -> Character:
    character = db.scalar(select(Character).where(Character.id == character_id)
                          .options(selectinload(Character.appearances)))
    if character is None:
        raise ApiError(404, "NOT_FOUND", "Персонаж не найден.")
    return character


def get_character(db: Session, character_id: int) -> dict:
    return serialize_character(find_character(db, character_id))


def apply_payload(character: Character, payload: CharacterCreate):
    data = payload.model_dump(exclude={"version"})
    appearances = data.pop("appearances")
    for field in ("abilities", "relationships"):
        data[field] = json.dumps(data[field], ensure_ascii=False)
    for field, value in data.items():
        setattr(character, field, value)
    character.appearances = [Appearance(**item) for item in appearances]


def create_character(db: Session, payload: CharacterCreate) -> dict:
    character = Character(version=1)
    apply_payload(character, payload)
    db.add(character)
    db.commit()
    return serialize_character(character)


def check_version(character: Character, version: int):
    if character.version != version:
        raise ApiError(409, "CONFLICT", "Запись уже изменена. Обновите данные перед сохранением.")


def update_character(db: Session, character_id: int, payload: CharacterUpdate) -> dict:
    character = find_character(db, character_id)
    check_version(character, payload.version)
    if character.slug != payload.slug:
        raise ApiError(409, "CONFLICT", "Slug нельзя изменить: он используется в постоянных ссылках.",
                       [{"field": "slug", "message": "Slug существующего персонажа неизменяем."}])
    apply_payload(character, payload)
    # Force a guarded parent UPDATE even when only appearances changed.
    character.version += 1
    db.commit()
    return serialize_character(character)


def delete_character(db: Session, character_id: int, version: int):
    character = find_character(db, character_id)
    check_version(character, version)
    db.delete(character)
    db.commit()
