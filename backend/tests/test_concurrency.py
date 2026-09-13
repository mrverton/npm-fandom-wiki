import pytest
from sqlalchemy.orm.exc import StaleDataError
from app import services
from app.schemas import CharacterCreate, CharacterUpdate


@pytest.mark.parametrize("second_operation", ["update", "delete"])
def test_two_loaded_writers_cannot_overwrite_committed_change(app, payload, second_operation):
    factory = app.state.session_factory
    with factory() as db:
        record = services.create_character(db, CharacterCreate.model_validate(payload))
    with factory() as first, factory() as second:
        # Hold both instances: each represents a request that read version 1.
        first_record = services.find_character(first, record["id"])
        second_record = services.find_character(second, record["id"])
        assert first_record.version == second_record.version == 1
        services.update_character(first, record["id"], CharacterUpdate.model_validate({**payload, "version": 1, "name": "Committed winner"}))
        with pytest.raises(StaleDataError):
            if second_operation == "update":
                services.update_character(second, record["id"], CharacterUpdate.model_validate({**payload, "version": 1, "name": "Stale loser", "appearances": []}))
            else:
                services.delete_character(second, record["id"], 1)
        second.rollback()
    with factory() as db:
        saved = services.get_character(db, record["id"])
        assert saved["name"] == "Committed winner" and saved["version"] == 2
        assert len(saved["appearances"]) == 1


def test_deleted_id_is_never_reassigned(client, headers, payload):
    first = client.post("/api/characters", headers=headers, json=payload).json()
    assert client.delete(f"/api/characters/{first['id']}", headers={**headers, "If-Match": "1"}).status_code == 204
    second = client.post("/api/characters", headers=headers, json={**payload, "slug": "new-record"}).json()
    assert second["id"] > first["id"]
    assert client.delete(f"/api/characters/{first['id']}", headers={**headers, "If-Match": "1"}).status_code == 404
    assert client.get(f"/api/characters/{second['id']}").status_code == 200
