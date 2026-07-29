"""
Точка входа FastAPI-бэкенда НПМ Фандом Вики.

Запуск локально:
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Эндпоинты:
    GET    /api/characters       — список всех персонажей с их появлениями
    GET    /api/characters/{id}  — один персонаж
    POST   /api/characters       — создать персонажа (только админ)
    PUT    /api/characters/{id}  — обновить персонажа (только админ)
    DELETE /api/characters/{id}  — удалить персонажа (только админ)
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud
from .database import engine, get_db, SessionLocal
from .auth import require_admin
from .seed import seed_if_empty

# Создаём таблицы, если их ещё нет
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="НПМ Фандом Вики API", version="1.0.0")

# CORS: разрешаем запросы с фронтенда. На проде замени "*" на точный домен
# твоего Netlify-сайта, например "https://zesty-biscotti-353076.netlify.app".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "npm-fandom-wiki-api"}


@app.get("/api/characters", response_model=list[schemas.CharacterOut])
def list_characters(db: Session = Depends(get_db)):
    return crud.get_characters(db)


@app.get("/api/characters/{character_id}", response_model=schemas.CharacterOut)
def get_character(character_id: int, db: Session = Depends(get_db)):
    character = crud.get_character(db, character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return character


@app.post("/api/characters", response_model=schemas.CharacterOut, status_code=status.HTTP_201_CREATED)
def create_character(
    payload: schemas.CharacterCreate,
    db: Session = Depends(get_db),
    _admin_id: int = Depends(require_admin),
):
    existing = db.query(models.Character).filter(models.Character.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Персонаж с таким slug уже существует")
    return crud.create_character(db, payload)


@app.put("/api/characters/{character_id}", response_model=schemas.CharacterOut)
def update_character(
    character_id: int,
    payload: schemas.CharacterUpdate,
    db: Session = Depends(get_db),
    _admin_id: int = Depends(require_admin),
):
    character = crud.update_character(db, character_id, payload)
    if character is None:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return character


@app.delete("/api/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(
    character_id: int,
    db: Session = Depends(get_db),
    _admin_id: int = Depends(require_admin),
):
    deleted = crud.delete_character(db, character_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return None
