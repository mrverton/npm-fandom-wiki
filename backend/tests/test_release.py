import json
from app.db_inspect import describe, snapshot


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
