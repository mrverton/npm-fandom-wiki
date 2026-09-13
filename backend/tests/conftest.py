import hashlib
import hmac
import json
import time
from pathlib import Path
from urllib.parse import urlencode

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app

BACKEND = Path(__file__).resolve().parent.parent
BOT_TOKEN = "test-bot-token-not-a-real-secret"
ADMIN_ID = 123456789


def migrate(database_url, revision="head"):
    config = Config(str(BACKEND / "alembic.ini"))
    config.attributes["database_url"] = database_url
    command.upgrade(config, revision)


def signed_data(user_id=ADMIN_ID, date=None, **extra):
    data = {"auth_date": str(int(time.time()) if date is None else date),
            "user": json.dumps({"id": user_id, "first_name": "Тест"}, ensure_ascii=False), **extra}
    check = "\n".join(f"{key}={data[key]}" for key in sorted(data))
    key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    data["hash"] = hmac.new(key, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(data)


@pytest.fixture
def settings(tmp_path):
    database_url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    migrate(database_url)
    return Settings(app_env="test", database_url=database_url, bot_token=BOT_TOKEN,
                    admin_ids=frozenset({ADMIN_ID}), allowed_origins=("https://wiki.example",))


@pytest.fixture
def app(settings):
    return create_app(settings)


@pytest.fixture
def client(app):
    with TestClient(app) as client:
        yield client


@pytest.fixture
def headers():
    return {"X-Telegram-Init-Data": signed_data()}


@pytest.fixture
def payload():
    return {"slug": "test-character", "name": "Тестовый персонаж", "shortName": "Тест",
            "color": "verton", "status": "Жив", "arc": "1 Арка", "role": "Исследователь",
            "occupation": "Наука", "race": None, "avatarInitial": "Т", "biography": "Лор сохранён.",
            "abilities": ["Портал"], "relationships": [{"id": "missing-historical", "description": "Историческая связь"}],
            "appearances": [{"episode": "1", "summary": "Первое появление"}]}
