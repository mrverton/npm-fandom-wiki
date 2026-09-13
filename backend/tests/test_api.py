import pytest
from sqlalchemy import text
from app import services


def test_health_empty_and_not_found(client):
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "database": "ready"}
    assert health.headers["cache-control"] == "no-store"
    assert client.get("/api/characters").json() == []
    assert client.get("/api/characters/999").status_code == 404
    assert client.get("/api/characters/0").status_code == 422
    assert client.get("/missing").json()["error"]["code"] == "NOT_FOUND"


def test_crud_versions_empty_204_and_restart(client, headers, payload, settings):
    from app.main import create_app
    from fastapi.testclient import TestClient
    created = client.post("/api/characters", headers=headers, json=payload)
    assert created.status_code == 201, created.text
    record = created.json()
    assert record["id"] > 0 and record["version"] == 1
    assert record["appearances"][0]["id"] > 0
    path = f"/api/characters/{record['id']}"
    assert client.get(path).json() == record
    assert client.get("/api/characters").json() == [record]
    changed = {**payload, "version": 1, "name": "Новое имя", "abilities": [], "appearances": []}
    updated = client.put(path, headers=headers, json=changed)
    assert updated.status_code == 200, updated.text
    assert updated.json()["version"] == 2 and updated.json()["name"] == "Новое имя"
    assert updated.json()["abilities"] == [] and updated.json()["appearances"] == []
    deleted = client.delete(path, headers={**headers, "If-Match": '"2"'})
    assert deleted.status_code == 204 and deleted.content == b""
    assert client.get(path).status_code == 404
    with TestClient(create_app(settings)) as restarted:
        assert restarted.get("/api/characters").json() == []


def test_conflicts_and_rollback(client, headers, payload, app):
    original = client.post("/api/characters", headers=headers, json=payload).json()
    path = f"/api/characters/{original['id']}"
    assert client.post("/api/characters", headers=headers, json=payload).status_code == 409
    # A failed duplicate transaction must not poison the next request/session.
    assert client.post("/api/characters", headers=headers, json={**payload, "slug": "second"}).status_code == 201
    assert client.put(path, headers=headers, json={**payload, "version": 1, "slug": "renamed"}).status_code == 409
    assert client.put(path, headers=headers, json={**payload, "version": 1, "appearances": [{"episode": "2", "summary": "Только появление"}]}).json()["version"] == 2
    assert client.put(path, headers=headers, json={**payload, "version": 1}).status_code == 409
    assert client.delete(path, headers={**headers, "If-Match": "1"}).status_code == 409
    assert client.get(path).json()["appearances"][0]["episode"] == "2"
    assert client.delete(path, headers={**headers, "If-Match": "2"}).status_code == 204
    with app.state.engine.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM appearances WHERE character_id=:id"), {"id": original["id"]}).scalar() == 0


@pytest.mark.parametrize("field,value", [
    ("slug", ""), ("slug", "bad/slug"), ("slug", "A"), ("slug", "a"*81),
    ("name", "  "), ("name", "a"*161), ("shortName", ""), ("color", "red"),
    ("status", "bad"), ("avatarInitial", "12345"), ("abilities", None),
    ("relationships", None), ("appearances", None), ("name", None), ("race", 123),
    ("abilities", [""]), ("abilities", ["x"]*101), ("biography", "x"*100001),
    ("appearances", [{"episode": "", "summary": ""}]),
    ("relationships", [{"id": "test-character", "description": "Self"}]),
    ("relationships", [{"id": "other", "description": "A"}, {"id": "other", "description": "B"}]),
], ids=["empty-slug", "unsafe-slug", "uppercase-slug", "long-slug", "blank-name", "long-name", "blank-short-name", "unknown-color", "unknown-status", "long-initial", "null-abilities", "null-relationships", "null-appearances", "null-name", "numeric-race", "empty-ability", "too-many-abilities", "long-biography", "blank-episode", "self-relationship", "duplicate-relationship"])
def test_invalid_payloads_are_422(client, headers, payload, field, value):
    response = client.post("/api/characters", headers=headers, json={**payload, field: value})
    assert response.status_code == 422, response.text
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert isinstance(response.json()["error"]["fields"], list)
    assert client.get("/api/characters").json() == []


def test_unknown_missing_fields_and_full_put(client, headers, payload):
    assert client.post("/api/characters", headers=headers, json={**payload, "id": 123}).status_code == 422
    assert client.post("/api/characters", headers=headers, json={**payload, "version": 1}).status_code == 422
    record = client.post("/api/characters", headers=headers, json=payload).json()
    path = f"/api/characters/{record['id']}"
    assert client.put(path, headers=headers, json={"name": "Partial", "version": 1}).status_code == 422
    for version in [None, 0, -1, True, "1"]:
        assert client.put(path, headers=headers, json={**payload, "version": version}).status_code == 422
    assert client.delete(path, headers=headers).status_code == 422
    for value in ["0", "-1", "W/\"1\"", '"1', '1"', "*", "1,2"]:
        assert client.delete(path, headers={**headers, "If-Match": value}).status_code == 422
    assert client.put("/api/characters/999", headers=headers, json={**payload, "version": 1}).status_code == 404
    assert client.delete("/api/characters/999", headers={**headers, "If-Match": "1"}).status_code == 404


def test_historical_relationship_survives_delete(client, headers, payload):
    target = client.post("/api/characters", headers=headers, json={**payload, "slug": "history"}).json()
    origin = client.post("/api/characters", headers=headers, json={**payload, "relationships": [{"id": "history", "description": "Лор"}]}).json()
    assert client.delete(f"/api/characters/{target['id']}", headers={**headers, "If-Match": "1"}).status_code == 204
    assert client.get(f"/api/characters/{origin['id']}").json()["relationships"] == [{"id": "history", "description": "Лор"}]


def test_cors_preflight_and_errors(client, monkeypatch):
    allowed = {"Origin": "https://wiki.example"}
    preflight = client.options("/api/characters/1", headers={**allowed, "Access-Control-Request-Method": "DELETE", "Access-Control-Request-Headers": "X-Telegram-Init-Data, If-Match, Content-Type"})
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == "https://wiki.example"
    assert "access-control-allow-credentials" not in preflight.headers
    denied = client.options("/api/characters", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
    assert denied.status_code == 400 and "access-control-allow-origin" not in denied.headers
    old = client.options("/api/characters", headers={**allowed, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "X-Telegram-User-Id"})
    assert old.status_code == 400
    assert client.get("/api/auth/session", headers=allowed).headers["access-control-allow-origin"] == allowed["Origin"]
    def explode(_db):
        raise RuntimeError("INTERNAL-DO-NOT-LEAK")
    monkeypatch.setattr(services, "list_characters", explode)
    failure = client.get("/api/characters", headers=allowed)
    assert failure.status_code == 500
    assert failure.headers["access-control-allow-origin"] == allowed["Origin"]
    assert failure.json()["error"]["code"] == "SERVER_ERROR"
    assert "INTERNAL" not in failure.text


def test_database_unavailable_health(client, app):
    with app.state.engine.begin() as connection:
        connection.execute(text("DROP TABLE appearances"))
        connection.execute(text("DROP TABLE characters"))
    response = client.get("/api/health", headers={"Origin": "https://wiki.example"})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "SERVICE_UNAVAILABLE"
    assert response.headers["access-control-allow-origin"] == "https://wiki.example"
