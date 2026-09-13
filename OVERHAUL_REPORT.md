# Overhaul report — 2026-09-13

Status: implemented and locally verified; production release pending provider access and database migration. This is not confirmation of a live deployment.

## Problems and root causes

The original client mixed archived JSON with live records, inferred loading from array length, reloaded after writes and could resurrect deleted records. Backend trusted a spoofable Telegram user ID, auto-created/seeded data at startup, had no versioned migrations or optimistic concurrency. HTTP logic, configuration, forms and native Telegram lifecycle were scattered. Fixed editorial names hid newly created records. Dirty drafts and delayed modal/loading state created races.

## Changes

One configured transport, endpoint adapters, canonical Character validator/serializer, normalized error classes and an explicit async store now form the data boundary. Thin contexts expose state. Source-of-truth API responses apply mutations atomically without follow-up GET. Latest-request generations and abort prevent stale responses. Failed uncertain writes require reconciliation. Slug remains stable; database ID and version are separate.

Fallback is read-only and visibly marked; only initial network/timeout/server failures qualify. Successful API access closes fallback for the browser tab, including refresh via a provenance-only sessionStorage marker. With storage disabled this protection survives only until refresh. Empty API results remain empty. Seed is an explicit command, never a startup side effect.

Backend validates Telegram HMAC, freshness and ADMIN_IDS for every write; development bearer access is prohibited in production. Explicit CORS supports signed headers and OPTIONS. Pydantic contracts, service transactions, stable SQLite IDs, constraints, Alembic legacy adoption/validation and version conflicts protect database integrity. PUT requires version, DELETE requires If-Match; old public user-ID authentication is removed. See API.md.

Admin LIST/CREATE/EDIT/DELETE has confirmed submitting/success/error flow, controlled validated drafts, dirty navigation protection and conflict recovery. Telegram provider owns initialization, events, theme/viewport/back/haptics/closing confirmation with browser fallback. Shared dialog/buttons/fields/notices and tokens retain the cyberpunk presentation. Timeline no longer depends on character fetching or timer-driven modal state. Original wiki_data.json is unchanged; future editorial names remain separate from real records.

## Tests and actual results

- npm install: passed; audit reports 0 vulnerabilities (416 packages). npm notes esbuild install-script approval policy; installed build works.
- npm run lint: passed, including layer boundary checks.
- npm run test: 80 passed across 8 files. Transport errors/204/timeouts/abort, normalization, validation, latest-request races, fallback provenance, atomic CRUD, configuration, React CRUD/dirty forms and Telegram lifecycle.
- npm run build: passed with HTTPS Render API configuration. Assets approximately 321 kB JS / 31 kB CSS before gzip.
- npm run check:dist: passed. Two exact React Router synthetic URL-parser base expressions contain localhost; these are not request destinations and are specifically excluded by context. Other loopback URLs and bot-token patterns fail the scan. No claim that the literal word localhost is entirely absent from dependency code.
- Backend pytest: 64 passed; 3 warnings (two upstream deprecations and an expected stale-delete ORM row-count warning in a concurrency rollback test). CRUD, signed auth/forbidden, validation, not-found, CORS, health, migration preservation/rollback, explicit seed and concurrent writes tested.
- Local uvicorn starts after Alembic upgrade head. SQLite readiness works. 16 real HTTP checks passed: auth, health, CRUD, conflicts, 204, CORS/preflight and original 4 records preserved.
- Real browser: catalog and profile render, direct hash route and refresh work; development admin create/edit/delete and dirty-form protection exercised on disposable data. Read-only fallback verified with backend unavailable. Mobile 390x844 inspected. Final timeline dialog opens/closes with original episode links; refreshed profile renders with no warning/error console entries. Normal browser requires no Telegram object.
- git diff --check: passed (Windows line-ending informational notices only).

## Not verified / release work

Live PostgreSQL and migrations on an actual production backup, actual Telegram device signed admin session, production CORS/API connectivity and published Netlify/Render revisions are not verified. Provider dashboards currently require login. Never run test CRUD against live lore. Production requires PostgreSQL, BOT_TOKEN, ADMIN_IDS, APP_ENV=production and exact Netlify ALLOWED_ORIGINS. Confirm persistent database and backup before migrations. If the original deployment uses SQLite, its content must be migrated explicitly to PostgreSQL; schema migrations alone do not copy between engines.

Netlify configuration targets the user-provided existing site and original Render backend, with HTML revalidation and immutable hashed assets. GitHub publication uses overhaul-production so the incompatible frontend/backend contract does not automatically replace the current main deployment before coordination. Remaining release work: access dashboards, inspect existing DB/settings, backup and migrate, deploy backend, verify health/CORS, release matching frontend, verify real Telegram admin. Rate limiting/backups/operational alerting belong in provider configuration.

## Deleted files

- .idea/.gitignore
- .idea/NPM.iml
- .idea/NPM2.iml
- .idea/inspectionProfiles/profiles_settings.xml
- .idea/misc.xml
- .idea/modules.xml
- .idea/vcs.xml
- backend/app/crud.py
- src/App.jsx
- src/config.js

## Created files

- .editorconfig
- .gitattributes
- .github/workflows/checks.yml
- API.md
- ARCHITECTURE.md
- DECISIONS.md
- OVERHAUL_PLAN.md
- backend/.env.example
- backend/alembic.ini
- backend/app/config.py
- backend/app/exceptions.py
- backend/app/routers.py
- backend/app/services.py
- backend/migrations/env.py
- backend/migrations/script.py.mako
- backend/migrations/versions/0001_legacy.py
- backend/migrations/versions/0002_contract.py
- backend/migrations/versions/0003_stable_ids.py
- backend/pytest.ini
- backend/requirements-dev.txt
- backend/tests/conftest.py
- backend/tests/test_api.py
- backend/tests/test_auth.py
- backend/tests/test_concurrency.py
- backend/tests/test_migrations.py
- eslint.config.js
- netlify.toml
- scripts/check-boundaries.mjs
- scripts/check-dist.mjs
- src/api/auth.js
- src/api/characters.js
- src/api/credentials.js
- src/api/errors.js
- src/app/App.jsx
- src/app/ErrorBoundary.jsx
- src/app/RouteError.jsx
- src/app/providers.jsx
- src/app/routes.jsx
- src/components/ArcContent.jsx
- src/components/admin/CharacterCollections.jsx
- src/components/common/AsyncState.jsx
- src/components/common/Button.jsx
- src/components/common/Dialog.jsx
- src/components/common/Field.jsx
- src/components/common/ResourceNotice.jsx
- src/config/index.js
- src/context/AdminContext.jsx
- src/context/TelegramContext.jsx
- src/data/charactersStore.js
- src/data/editorial.js
- src/data/sessionPolicy.js
- src/hooks/useBackNavigation.js
- src/hooks/useUnsavedChanges.js
- src/models/character.js
- src/pages/NotFound.jsx
- src/styles/timeline.css
- src/styles/tokens.js
- tests/api-client.test.js
- tests/api-endpoints.test.js
- tests/app-flow.test.jsx
- tests/character-model.test.js
- tests/characters-store.test.js
- tests/config.test.js
- tests/fixtures/character.json
- tests/session-policy.test.js
- tests/setup.js
- tests/telegram.test.jsx
- vitest.config.js
- OVERHAUL_REPORT.md
