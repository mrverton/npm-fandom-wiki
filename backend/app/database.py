"""
Настройка подключения к базе данных через SQLAlchemy.

По умолчанию (если переменная окружения DATABASE_URL не задана) используется
локальный файл SQLite — удобно для разработки на своём компьютере, ничего
дополнительно настраивать не нужно.

ВАЖНО про продакшен на Render: бесплатный (Free) веб-сервис Render имеет
эфемерную файловую систему — любые файлы, записанные на диск (включая
SQLite-базу), стираются при каждом перезапуске, редеплое или "засыпании"
сервиса после периода бездействия. Именно поэтому изменения через
админ-панель "откатываются" после закрытия/обновления приложения: Render
через какое-то время простоя перезапускает контейнер, SQLite-файл создаётся
заново с нуля, и seed.py заполняет его исходными данными из wiki_data.json.

Чтобы изменения сохранялись НАВСЕГДА, нужна база данных, которая живёт
отдельно от файловой системы веб-сервиса — например, Postgres (подойдёт
Render Postgres, Neon.tech, Supabase — любой). Дальше:

  1. Создай Postgres-базу у любого из провайдеров выше (у всех есть
     бесплатный тариф).
  2. Скопируй её connection string (обычно начинается с postgres:// или
     postgresql://).
  3. В настройках Render-сервиса → Environment добавь переменную:
       DATABASE_URL = <твой connection string>
  4. Передеплой сервис — код ниже сам всё подхватит, больше ничего менять
     не нужно ни в одном другом файле.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./npm_wiki.db")

# Render (и Heroku) иногда отдают connection string в старом формате
# "postgres://...", а современные SQLAlchemy + psycopg2 ожидают
# "postgresql://...". Приводим к нужному виду автоматически.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# check_same_thread нужен только для SQLite (по умолчанию она разрешает
# работу лишь из потока, который открыл соединение, а FastAPI использует
# несколько потоков). Для Postgres этот параметр не нужен и не поддерживается.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency для FastAPI — открывает сессию БД на время запроса и закрывает после."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
