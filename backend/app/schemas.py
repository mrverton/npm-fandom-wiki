"""Wire contract shared by requests, responses, seed validation and migrations."""
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Slug = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
ShortName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Text200 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
PositiveVersion = Annotated[int, Field(strict=True, gt=0)]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RelationshipItem(ContractModel):
    id: Slug
    description: Annotated[str, StringConstraints(min_length=1, max_length=5000)]


class AppearanceBase(ContractModel):
    episode: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    summary: Annotated[str, StringConstraints(max_length=10000)]


class AppearanceOut(AppearanceBase):
    id: PositiveVersion


class CharacterCreate(ContractModel):
    slug: Slug
    name: Name
    shortName: ShortName
    color: Literal["verton", "qzero", "cortex", "terton"]
    status: Literal["Жив", "Жива", "Мертв", "Неизвестно", "Связь потеряна"]
    arc: Annotated[str, StringConstraints(max_length=120)]
    role: Text200
    occupation: Text200
    race: Text200 | None
    avatarInitial: Annotated[str, StringConstraints(min_length=1, max_length=4)]
    biography: Annotated[str, StringConstraints(max_length=100000)]
    abilities: Annotated[list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]], Field(max_length=100)]
    relationships: Annotated[list[RelationshipItem], Field(max_length=100)]
    appearances: Annotated[list[AppearanceBase], Field(max_length=200)]

    @model_validator(mode="after")
    def unique_relationships(self):
        ids = [item.id for item in self.relationships]
        if len(set(ids)) != len(ids):
            raise ValueError("Повторяющиеся связи с персонажем недопустимы")
        if self.slug in ids:
            raise ValueError("Персонаж не может ссылаться на себя в отношениях")
        return self


class CharacterUpdate(CharacterCreate):
    version: PositiveVersion


class CharacterOut(CharacterCreate):
    id: PositiveVersion
    version: PositiveVersion
    appearances: list[AppearanceOut]


class SessionOut(ContractModel):
    userId: int
    isAdmin: bool


class HealthOut(ContractModel):
    status: Literal["ok"]
    database: Literal["ready"]


class ErrorField(ContractModel):
    field: str
    message: str


class ErrorDetail(ContractModel):
    code: str
    message: str
    fields: list[ErrorField] | None = None


class ErrorResponse(ContractModel):
    error: ErrorDetail
