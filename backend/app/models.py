"""
ORM-модели таблиц базы данных: characters и appearances.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    shortName = Column(String, nullable=False)
    color = Column(String, nullable=False, default="qzero")
    status = Column(String, nullable=False, default="Неизвестно")
    arc = Column(String, default="")
    role = Column(String, default="")
    occupation = Column(String, default="")
    race = Column(String, nullable=True)  # может отсутствовать (напр. у Кьюзеро)
    avatarInitial = Column(String, default="?")
    biography = Column(Text, default="")

    # Способности храним как JSON-массив строк, сериализованный в текст.
    abilities = Column(Text, default="[]")

    # Отношения храним как JSON-массив объектов {id, description}, тоже строкой.
    relationships = Column(Text, default="[]")

    appearances = relationship(
        "Appearance",
        back_populates="character",
        cascade="all, delete-orphan",
        order_by="Appearance.id",
    )


class Appearance(Base):
    __tablename__ = "appearances"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    episode = Column(String, nullable=False)
    summary = Column(Text, default="")

    character = relationship("Character", back_populates="appearances")
