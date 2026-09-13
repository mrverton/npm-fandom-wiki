"""Persist existing column names and lore, with versioned writes."""
from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


class Character(Base):
    __tablename__ = "characters"
    __table_args__ = (
        CheckConstraint("length(slug) BETWEEN 1 AND 80", name="ck_characters_slug_length"),
        CheckConstraint("length(trim(name)) BETWEEN 1 AND 160", name="ck_characters_name_length"),
        CheckConstraint('length(trim("shortName")) BETWEEN 1 AND 80', name="ck_characters_short_name_length"),
        CheckConstraint("version > 0", name="ck_characters_version_positive"),
        CheckConstraint("color IN ('verton','qzero','cortex','terton')", name="ck_characters_color"),
        CheckConstraint("status IN ('Жив','Жива','Мертв','Неизвестно','Связь потеряна')", name="ck_characters_status"),
        {"sqlite_autoincrement": True},
    )
    id = Column(Integer, primary_key=True)
    slug = Column(String(80), unique=True, index=True, nullable=False)
    version = Column(Integer, nullable=False, default=1, server_default="1")
    name = Column(String(160), nullable=False)
    shortName = Column(String(80), nullable=False)
    color = Column(String(32), nullable=False)
    status = Column(String(64), nullable=False)
    arc = Column(String(120), nullable=False)
    role = Column(String(200), nullable=False)
    occupation = Column(String(200), nullable=False)
    race = Column(String(200), nullable=True)
    avatarInitial = Column(String(4), nullable=False)
    biography = Column(Text, nullable=False)
    abilities = Column(Text, nullable=False)
    relationships = Column(Text, nullable=False)
    appearances = relationship("Appearance", back_populates="character", cascade="all, delete-orphan", order_by="Appearance.id")
    __mapper_args__ = {"version_id_col": version, "version_id_generator": False}


class Appearance(Base):
    __tablename__ = "appearances"
    __table_args__ = (CheckConstraint("length(trim(episode)) BETWEEN 1 AND 200", name="ck_appearances_episode_length"),)
    id = Column(Integer, primary_key=True)
    character_id = Column(Integer, ForeignKey("characters.id", name="fk_appearances_character", ondelete="CASCADE"), nullable=False, index=True)
    episode = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    character = relationship("Character", back_populates="appearances")
