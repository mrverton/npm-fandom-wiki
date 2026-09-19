import json
import pytest
from sqlalchemy import create_engine, event, inspect, text
from app.db_inspect import describe, snapshot
from app.db_rollout import migrate_and_verify
from test_migrations import legacy_database


def test_preflight_is_read_only_and_does_not_print_lore(client, app, headers, payload):
    assert client.post('/api/characters', headers=headers, json=payload).status_code == 201
    with app.state.engine.connect() as connection:
        before = snapshot(connection)
        result = describe(connection)
        assert snapshot(connection) == before
    assert result['revision'] == ['0003_stable_ids']
    assert result['counts'] == {'characters': 1, 'appearances': 1}
    assert 'version' in result['columns']['characters']
    assert payload['name'] not in json.dumps(result, ensure_ascii=False)
    assert payload['biography'] not in json.dumps(result, ensure_ascii=False)
    assert len(result['fingerprint']) == 64


def transaction_engine(url):
    engine = create_engine(url)
    @event.listens_for(engine, 'connect')
    def connect(dbapi, _record):
        dbapi.isolation_level = None
        dbapi.execute('PRAGMA foreign_keys=OFF')
    @event.listens_for(engine, 'begin')
    def begin(connection):
        connection.exec_driver_sql('BEGIN')
    return engine


@pytest.mark.parametrize('commit', [False, True])
def test_release_verifies_legacy_rows_inside_owned_transaction(tmp_path, payload, commit):
    engine = transaction_engine(legacy_database(tmp_path, [payload]))
    with engine.connect() as connection:
        transaction = connection.begin()
        before = snapshot(connection)
        result = migrate_and_verify(connection, before)
        assert result['revision'] == ['0003_stable_ids']
        assert result['counts'] == {'characters': 1, 'appearances': 1}
        if commit:
            transaction.commit()
        else:
            transaction.rollback()
    with engine.connect() as connection:
        if commit:
            assert snapshot(connection)['characters'][0]['version'] == 1
        else:
            assert snapshot(connection) == before
            assert 'alembic_version' not in inspect(connection).get_table_names()
            assert 'version' not in [c['name'] for c in inspect(connection).get_columns('characters')]
    engine.dispose()


def test_release_refuses_changed_lore_and_rolls_back(tmp_path, payload, monkeypatch):
    from app import db_rollout
    engine = transaction_engine(legacy_database(tmp_path, [payload]))
    original_upgrade = db_rollout.command.upgrade
    def broken_upgrade(config, target):
        original_upgrade(config, target)
        config.attributes['connection'].execute(text("UPDATE characters SET biography='lost'"))
    monkeypatch.setattr(db_rollout.command, 'upgrade', broken_upgrade)
    with engine.connect() as connection:
        before = snapshot(connection)
    with pytest.raises(RuntimeError, match='changed existing rows'):
        with engine.begin() as connection:
            migrate_and_verify(connection, before)
    with engine.connect() as connection:
        assert snapshot(connection) == before
        assert 'alembic_version' not in inspect(connection).get_table_names()
    engine.dispose()
