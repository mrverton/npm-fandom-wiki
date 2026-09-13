from dataclasses import replace
import time

import pytest
from fastapi.testclient import TestClient
from app.auth import verify_init_data
from app.config import Settings
from app.exceptions import ApiError
from app.main import create_app
from conftest import ADMIN_ID, signed_data


def test_signed_admin_and_reader_sessions(client, headers, payload):
    assert client.get("/api/auth/session", headers=headers).json() == {"userId": ADMIN_ID, "isAdmin": True}
    reader = {"X-Telegram-Init-Data": signed_data(user_id=77)}
    assert client.get("/api/auth/session", headers=reader).json() == {"userId": 77, "isAdmin": False}
    for method, path, body in [("POST", "/api/characters", payload),
                              ("PUT", "/api/characters/1", {**payload, "version": 1}),
                              ("DELETE", "/api/characters/1", None)]:
        response = client.request(method, path, headers={**reader, "If-Match": "1"}, json=body)
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "AUTHORIZATION_ERROR"


@pytest.mark.parametrize("kind", ["missing", "public-id", "forged", "expired", "future", "duplicate", "malformed", "oversized", "invalid-id", "boolean-id"])
def test_invalid_identity_cannot_authorize_any_write(client, payload, kind):
    raw = signed_data()
    headers = {}
    if kind == "public-id":
        headers["X-Telegram-User-Id"] = str(ADMIN_ID)
    elif kind == "forged":
        raw = raw.replace(str(ADMIN_ID), str(ADMIN_ID + 1))
    elif kind == "expired":
        raw = signed_data(date=int(time.time()) - 3601)
    elif kind == "future":
        raw = signed_data(date=int(time.time()) + 90)
    elif kind == "duplicate":
        raw += "&auth_date=0"
    elif kind == "malformed":
        raw = "bad=%FF&hash=bad"
    elif kind == "oversized":
        raw = "x=" + "a" * 16385
    elif kind == "invalid-id":
        raw = signed_data(user_id="123456789")
    elif kind == "boolean-id":
        raw = signed_data(user_id=True)
    if kind not in {"missing", "public-id"}:
        headers["X-Telegram-Init-Data"] = raw
    assert client.get("/api/auth/session", headers=headers).status_code == 401
    for method, path, body in [("POST", "/api/characters", payload),
                              ("PUT", "/api/characters/1", {**payload, "version": 1}),
                              ("DELETE", "/api/characters/1", None)]:
        response = client.request(method, path, headers={**headers, "If-Match": "1"}, json=body)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "TelegramInitData"
    assert client.get("/api/characters").json() == []


def test_signature_is_bound_to_bot_and_replay_window(settings):
    now = int(time.time())
    assert verify_init_data(signed_data(date=now - 3600), settings, now=now).user_id == ADMIN_ID
    for invalid in [replace(settings, bot_token="different-bot"), replace(settings, bot_token="")]:
        with pytest.raises(ApiError) as error:
            verify_init_data(signed_data(), invalid)
        assert error.value.status == 401


def test_browser_development_login_is_explicit(settings):
    token = "development-only-token-123456789"
    with TestClient(create_app(replace(settings, app_env="development", dev_admin_token=token))) as client:
        assert client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"}).json() == {"userId": 1, "isAdmin": True}
        assert client.get("/api/auth/session", headers={"Authorization": "Bearer invalid"}).status_code == 401
        # Invalid Telegram data cannot downgrade to a development bypass.
        assert client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}", "X-Telegram-Init-Data": "forged"}).status_code == 401
    with TestClient(create_app(settings)) as client:
        assert client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"}).status_code == 401


@pytest.mark.parametrize("overrides", [
    {"app_env": "invalid"}, {"allowed_origins": ("*",)}, {"allowed_origins": ("https://wiki.example/path",)},
    {"dev_admin_token": "short"}, {"app_env": "test", "dev_admin_token": "x" * 30},
    {"app_env": "production"}, {"admin_ids": frozenset({True})},
    {"app_env": "production", "database_url": "postgresql://user:pass@db/wiki", "bot_token": "server-only", "admin_ids": frozenset({1}), "allowed_origins": ("http://localhost:5173",)},
    {"app_env": "production", "database_url": "postgresql://user:pass@db/wiki", "bot_token": "server-only", "admin_ids": frozenset({1}), "allowed_origins": ("https://wiki.example",), "dev_admin_token": "x" * 30},
], ids=["bad-env", "wildcard-origin", "origin-path", "weak-dev-token", "test-dev-bypass", "missing-prod-settings", "boolean-admin-id", "production-loopback", "production-dev-bypass"])
def test_invalid_configuration_fails_closed(overrides):
    with pytest.raises(ValueError):
        Settings(**overrides)


def test_production_configuration_uses_server_secrets():
    settings = Settings(app_env="production", database_url="postgresql://user:pass@db/wiki",
                        bot_token="server-only", admin_ids=frozenset({ADMIN_ID}), allowed_origins=("https://wiki.example",))
    assert not settings.dev_admin_token
