from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud
from .database import engine, get_db, SessionLocal
from .auth import require_admin
from .seed import seed_if_empty

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="НПМ Фандом Вики API", version="1.0.0")

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


@app.get("/api/characters", response_model=List[schemas.CharacterOut])
def list_characters(db: Session = Depends(get_db)):
    return crud.get_characters(db)


@app.get("/api/characters/{character_id}", response_model=schemas.CharacterOut)
def get_character(character_id: int, db: Session = Depends(get_db)):
    c = crud.get_character(db, character_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return c


@app.post("/api/characters", response_model=schemas.CharacterOut, status_code=201)
def create_character(
    payload: schemas.CharacterCreate,
    db: Session = Depends(get_db),
    _: int = Depends(require_admin),
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
    _: int = Depends(require_admin),
):
    c = crud.update_character(db, character_id, payload)
    if c is None:
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return c


@app.delete("/api/characters/{character_id}", status_code=204)
def delete_character(
    character_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(require_admin),
):
    if not crud.delete_character(db, character_id):
        raise HTTPException(status_code=404, detail="Персонаж не найден")
    return None
