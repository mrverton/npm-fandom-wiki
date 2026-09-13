import json
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from app.config import Settings
from app.database import build_engine, build_session_factory
from app.main import create_app
from app.seed import seed_database
from app import services
from conftest import migrate

SEED = Path(__file__).resolve().parents[2] / "src/data/wiki_data.json"


def legacy_database(tmp_path, records):
    url = f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}"
    migrate(url, "0001_legacy")
    engine = create_engine(url)
    with engine.begin() as db:
        for index, original in enumerate(records, start=1):
            record = {key: value for key, value in original.items() if key not in {"id", "appearances"}}
            record.setdefault("race", None)
            record.update(id=index, abilities=json.dumps(record["abilities"], ensure_ascii=False), relationships=json.dumps(record["relationships"], ensure_ascii=False))
            columns = ",".join(f'"{key}"' for key in record)
            values = ",".join(f":{key}" for key in record)
            db.execute(text(f"INSERT INTO characters ({columns}) VALUES ({values})"), record)
            for appearance in original["appearances"]:
                db.execute(text("INSERT INTO appearances (character_id,episode,summary) VALUES (:id,:episode,:summary)"), {"id": index, **appearance})
        # Emulate an original unversioned deployment, not an Alembic-built DB.
        db.execute(text("DROP TABLE alembic_version"))
    engine.dispose()
    return url


def snapshot(url):
    engine = create_engine(url)
    try:
        with engine.connect() as db:
            return {table: [dict(row) for row in db.execute(text(f"SELECT * FROM {table} ORDER BY id")).mappings()]
                    for table in ["characters", "appearances"]}
    finally:
        engine.dispose()


def test_adopt_original_lore_preserves_all_records_ids_children_and_constraints(tmp_path):
    originals = json.loads(SEED.read_text(encoding="utf-8"))["characters"]
    url = legacy_database(tmp_path, originals)
    before = snapshot(url)
    migrate(url)
    after = snapshot(url)
    assert after["appearances"] == before["appearances"]
    assert [{key: value for key, value in row.items() if key != "version"} for row in after["characters"]] == before["characters"]
    assert all(row["version"] == 1 for row in after["characters"])
    engine = build_engine(url)
    try:
        inspector = inspect(engine)
        assert any(index["unique"] and index["column_names"] == ["slug"] for index in inspector.get_indexes("characters"))
        assert any(index["column_names"] == ["character_id"] for index in inspector.get_indexes("appearances"))
        assert inspector.get_foreign_keys("appearances")[0]["options"]["ondelete"] == "CASCADE"
        with engine.begin() as db:
            with pytest.raises(IntegrityError):
                db.execute(text("UPDATE characters SET version=0"))
        with engine.connect() as db:
            assert db.execute(text("PRAGMA foreign_key_check")).all() == []
            assert db.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0003_stable_ids"
    finally:
        engine.dispose()
    with TestClient(create_app(Settings(app_env="test", database_url=url))) as client:
        records = client.get("/api/characters").json()
        assert len(records) == len(originals) == 4
        assert [record["biography"] for record in records] == [record["biography"] for record in originals]
    migrate(url)  # Repeated deployment must be idempotent.
    assert snapshot(url) == after


@pytest.mark.parametrize("damage", ["null", "invalid-json", "unsafe-slug", "whitespace", "orphan"])
def test_invalid_legacy_migration_refuses_without_partial_changes(tmp_path, payload, damage):
    url = legacy_database(tmp_path, [payload])
    engine = create_engine(url)
    with engine.begin() as db:
        statements = {"null": "UPDATE characters SET biography=NULL",
                      "invalid-json": "UPDATE characters SET abilities='broken-json'",
                      "unsafe-slug": "UPDATE characters SET slug='unsafe/slug'",
                      "whitespace": "UPDATE characters SET name=' needs explicit trim '",
                      "orphan": "UPDATE appearances SET character_id=999"}
        db.execute(text(statements[damage]))
    before = snapshot(url)
    with pytest.raises(RuntimeError, match="Migration refused"):
        migrate(url)
    assert snapshot(url) == before
    assert "version" not in {column["name"] for column in inspect(engine).get_columns("characters")}
    assert "alembic_version" not in inspect(engine).get_table_names()
    engine.dispose()


def test_partial_unknown_schema_cannot_be_adopted(tmp_path):
    url = f"sqlite:///{(tmp_path / 'partial.db').as_posix()}"
    engine = create_engine(url)
    with engine.begin() as db:
        db.execute(text("CREATE TABLE characters (id INTEGER PRIMARY KEY)"))
    with pytest.raises(RuntimeError, match="Legacy adoption refused"):
        migrate(url)
    assert set(inspect(engine).get_table_names()) == {"characters"}
    engine.dispose()


def test_explicit_seed_preserves_original_lore_and_refuses_merge(app, settings):
    originals = json.loads(SEED.read_text(encoding="utf-8"))["characters"]
    with app.state.session_factory() as db:
        assert seed_database(db, SEED) == 4
        records = services.list_characters(db)
        assert [item["biography"] for item in records] == [item["biography"] for item in originals]
        with pytest.raises(ValueError, match="not empty"):
            seed_database(db, SEED)
        for record in records:
            services.delete_character(db, record["id"], record["version"])
    with TestClient(create_app(settings)) as restarted:
        assert restarted.get("/api/characters").json() == []


def test_invalid_seed_is_atomic(app, tmp_path, payload):
    source = tmp_path / "invalid-seed.json"
    source.write_text(json.dumps({"characters": [payload, {**payload, "slug": "second", "name": None}]}), encoding="utf-8")
    with app.state.session_factory() as db:
        with pytest.raises(ValueError):
            seed_database(db, source)
        assert services.list_characters(db) == []


def test_startup_requires_migrated_complete_database(tmp_path, settings):
    url = f"sqlite:///{(tmp_path / 'unmigrated.db').as_posix()}"
    with pytest.raises(RuntimeError, match="schema missing"):
        with TestClient(create_app(replace(settings, database_url=url))):
            pass
    engine = build_engine(settings.database_url)
    with engine.begin() as db:
        db.execute(text("DROP TABLE appearances"))
    engine.dispose()
    with pytest.raises(RuntimeError, match="schema missing"):
        with TestClient(create_app(settings)):
            pass
