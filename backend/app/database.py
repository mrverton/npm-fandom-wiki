"""
Настройка подключения к базе данных SQLite через SQLAlchemy.
Файл базы данных (npm_wiki.db) создаётся автоматически рядом с этим модулем
при первом запуске сервера.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./npm_wiki.db"

# check_same_thread=False нужен, потому что SQLite по умолчанию разрешает
# работу только из потока, который открыл соединение, а FastAPI использует
# несколько потоков для обработки запросов.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency для FastAPI — открывает сессию БД на время запроса и закрывает после."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
