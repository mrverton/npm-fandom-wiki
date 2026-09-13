"""Thin HTTP endpoints over the service contract."""
import re
from typing import Annotated
from fastapi import APIRouter, Depends, Header, Path, Response
from sqlalchemy.orm import Session
from . import schemas, services
from .auth import Identity, authenticate, require_admin
from .database import get_db
from .exceptions import ApiError

router = APIRouter(prefix="/api", responses={code: {"model": schemas.ErrorResponse} for code in (401, 403, 404, 409, 422, 500, 503)})
Database = Annotated[Session, Depends(get_db)]
CharacterId = Annotated[int, Path(gt=0)]
Admin = Annotated[Identity, Depends(require_admin)]


@router.get("/health", response_model=schemas.HealthOut, tags=["health"])
def health(db: Database):
    services.check_database(db)
    return {"status": "ok", "database": "ready"}


@router.get("/auth/session", response_model=schemas.SessionOut, tags=["auth"])
def auth_session(identity: Annotated[Identity, Depends(authenticate)]):
    return {"userId": identity.user_id, "isAdmin": identity.is_admin}


@router.get("/characters", response_model=list[schemas.CharacterOut], tags=["characters"])
def list_characters(db: Database):
    return services.list_characters(db)


@router.get("/characters/{character_id}", response_model=schemas.CharacterOut, tags=["characters"])
def get_character(character_id: CharacterId, db: Database):
    return services.get_character(db, character_id)


@router.post("/characters", response_model=schemas.CharacterOut, status_code=201, tags=["characters"])
def create_character(payload: schemas.CharacterCreate, _admin: Admin, db: Database):
    return services.create_character(db, payload)


@router.put("/characters/{character_id}", response_model=schemas.CharacterOut, tags=["characters"])
def update_character(character_id: CharacterId, payload: schemas.CharacterUpdate, _admin: Admin, db: Database):
    return services.update_character(db, character_id, payload)


@router.delete("/characters/{character_id}", status_code=204, response_class=Response, tags=["characters"])
def delete_character(character_id: CharacterId, _admin: Admin, db: Database,
                     if_match: Annotated[str, Header(description='Current character version, e.g. "1"')]):
    if not re.fullmatch(r'(?:[1-9][0-9]*|"[1-9][0-9]*")', if_match) or len(if_match) > 20:
        raise ApiError(422, "VALIDATION_ERROR", "Укажите текущую версию персонажа в If-Match.",
                       [{"field": "If-Match", "message": "Нужна положительная целая версия."}])
    services.delete_character(db, character_id, int(if_match.strip('"')))
    return Response(status_code=204)
