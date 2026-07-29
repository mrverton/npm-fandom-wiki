"""
Pydantic-схемы для валидации входящих запросов и формирования ответов API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class RelationshipItem(BaseModel):
    id: str
    description: str


class AppearanceBase(BaseModel):
    episode: str
    summary: str = ""


class AppearanceOut(AppearanceBase):
    id: int

    class Config:
        from_attributes = True


class CharacterBase(BaseModel):
    slug: str
    name: str
    shortName: str
    color: str = "qzero"
    status: str = "Неизвестно"
    arc: str = ""
    role: str = ""
    occupation: str = ""
    race: Optional[str] = None
    avatarInitial: str = "?"
    biography: str = ""
    abilities: List[str] = Field(default_factory=list)
    relationships: List[RelationshipItem] = Field(default_factory=list)


class CharacterCreate(CharacterBase):
    appearances: List[AppearanceBase] = Field(default_factory=list)


class CharacterUpdate(BaseModel):
    """Все поля необязательны — обновляем только то, что прислали."""
    slug: Optional[str] = None
    name: Optional[str] = None
    shortName: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None
    arc: Optional[str] = None
    role: Optional[str] = None
    occupation: Optional[str] = None
    race: Optional[str] = None
    avatarInitial: Optional[str] = None
    biography: Optional[str] = None
    abilities: Optional[List[str]] = None
    relationships: Optional[List[RelationshipItem]] = None
    appearances: Optional[List[AppearanceBase]] = None


class CharacterOut(BaseModel):
    id: int
    slug: str
    name: str
    shortName: str
    color: str
    status: str
    arc: str
    role: str
    occupation: str
    race: Optional[str] = None
    avatarInitial: str
    biography: str
    abilities: List[str]
    relationships: List[RelationshipItem]
    appearances: List[AppearanceOut]

    class Config:
        from_attributes = True
