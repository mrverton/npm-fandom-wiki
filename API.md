# API contract

Base path `/api`. Executable contract: `backend/app/schemas.py`, `routers.py`; server exposes `/docs` and `/openapi.json`.

| Method/path | Request | Success | Access |
|---|---|---|---|
| GET /health | none | 200 {status:ok,database:ready} | public |
| GET /auth/session | authentication | 200 {userId,isAdmin} | authenticated |
| GET /characters | none | 200 Character[] (empty allowed) | public |
| GET /characters/{id} | positive database ID | 200 Character | public |
| POST /characters | CharacterCreate | 201 Character, version 1 | admin |
| PUT /characters/{id} | full CharacterCreate + version | 200 Character, increased version | admin |
| DELETE /characters/{id} | If-Match containing current positive version, optionally quoted | 204 empty body | admin |

PATCH is not implemented. UI routes use stable slugs; API uses database IDs. No implicit seed or automatic write retry.

## CharacterCreate

All fields required, unknown fields rejected, strings trimmed:

```json
{"slug":"example","name":"Пример","shortName":"Пример","color":"verton","status":"Неизвестно","arc":"","role":"","occupation":"","race":null,"avatarInitial":"П","biography":"","abilities":[],"relationships":[],"appearances":[]}
```

Slug: 1–80, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique and immutable. Name 1–160; shortName 1–80; avatarInitial 1–4; arc ≤120; role/occupation/race ≤200; biography ≤100000. Race may be null. Colors: verton/qzero/cortex/terton. Status: Жив/Жива/Мертв/Неизвестно/Связь потеряна.

Abilities: ≤100 strings of 1–1000 characters. Relationships: ≤100 `{id: targetSlug, description}`; description 1–5000; duplicate/self references rejected. Historical references may outlive targets. Appearances: ≤200 `{episode,summary}`; episode 1–200, summary ≤10000.

Response adds positive integer id/version and appearance database IDs. Frontend maps relationships[].id to canonical slug. PUT sends full editable data and last observed version, without database IDs in JSON. Stale PUT/DELETE returns 409.

## Authentication

Production: X-Telegram-Init-Data carries original Telegram initData. Server verifies HMAC using BOT_TOKEN, authentication time (default maximum age 3600 seconds, future tolerance 30 seconds), and identity. ADMIN_IDS grants mutation rights. X-Telegram-User-Id grants no authority.

Development may explicitly enable Authorization: Bearer DEV_ADMIN_TOKEN, entered manually and held only in frontend memory. Production prohibits this branch. No cookies or frontend secrets. Authenticated non-admin session returns isAdmin=false; writes return 403.

## Errors

Envelope: `{"error":{"code":"VALIDATION_ERROR","message":"Проверьте данные.","fields":[{"field":"name","message":"Обязательное поле."}]}}`. Fields are optional.

401 missing/invalid/expired auth; 403 non-admin; 404 absent record; 409 duplicate/immutable slug or stale version; 422 invalid body/path/header; 500 internal failure; 503 database unavailable/not ready. Authentication protects every mutation. No SQL or stack traces returned.

Frontend distinguishes network, timeout, abort and malformed successful responses. 204 is successful without parsing JSON. An uncertain write requires reload before deciding to retry.

## CORS and deployment

Explicit ALLOWED_ORIGINS, credentials disabled. Headers: Content-Type, X-Telegram-Init-Data, Authorization, If-Match. OPTIONS handled by middleware. API uses no-store.

Migration from original contract: signed auth replaces public ID; version required for PUT and If-Match for DELETE. Apply Alembic before backend startup. Deploy frontend and backend together: new frontend rejects old unversioned data; old frontend cannot authenticate to new backend.
