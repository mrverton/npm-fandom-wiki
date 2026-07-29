"""
Функции работы с базой данных: чтение, создание, обновление, удаление персонажей.
Способности (abilities) и отношения (relationships) хранятся в БД как JSON-строка,
здесь мы сериализуем/десериализуем их в python-объекты.
"""
import json
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas


def _character_to_dict(character: models.Character) -> dict:
    return {
        "id": character.id,
        "slug": character.slug,
        "name": character.name,
        "shortName": character.shortName,
        "color": character.color,
        "status": character.status,
        "arc": character.arc,
        "role": character.role,
        "occupation": character.occupation,
        "race": character.race,
        "avatarInitial": character.avatarInitial,
        "biography": character.biography,
        "abilities": json.loads(character.abilities or "[]"),
        "relationships": json.loads(character.relationships or "[]"),
        "appearances": [
            {"id": a.id, "episode": a.episode, "summary": a.summary}
            for a in character.appearances
        ],
    }


def get_characters(db: Session) -> List[dict]:
    characters = db.query(models.Character).all()
    return [_character_to_dict(c) for c in characters]


def get_character(db: Session, character_id: int) -> Optional[dict]:
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        return None
    return _character_to_dict(character)


def create_character(db: Session, payload: schemas.CharacterCreate) -> dict:
    character = models.Character(
        slug=payload.slug,
        name=payload.name,
        shortName=payload.shortName,
        color=payload.color,
        status=payload.status,
        arc=payload.arc,
        role=payload.role,
        occupation=payload.occupation,
        race=payload.race,
        avatarInitial=payload.avatarInitial,
        biography=payload.biography,
        abilities=json.dumps(payload.abilities, ensure_ascii=False),
        relationships=json.dumps(
            [r.model_dump() for r in payload.relationships], ensure_ascii=False
        ),
    )
    for app_item in payload.appearances:
        character.appearances.append(
            models.Appearance(episode=app_item.episode, summary=app_item.summary)
        )

    db.add(character)
    db.commit()
    db.refresh(character)
    return _character_to_dict(character)


def update_character(
    db: Session, character_id: int, payload: schemas.CharacterUpdate
) -> Optional[dict]:
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "abilities" in data:
        character.abilities = json.dumps(data.pop("abilities"), ensure_ascii=False)

    if "relationships" in data:
        character.relationships = json.dumps(data.pop("relationships"), ensure_ascii=False)

    if "appearances" in data:
        new_appearances = data.pop("appearances")
        character.appearances.clear()
        for app_item in new_appearances:
            character.appearances.append(
                models.Appearance(
                    episode=app_item["episode"], summary=app_item.get("summary", "")
                )
            )

    for field, value in data.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)
    return _character_to_dict(character)


def delete_character(db: Session, character_id: int) -> bool:
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        return False
    db.delete(character)
    db.commit()
    return True
