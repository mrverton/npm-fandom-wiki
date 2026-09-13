# Backend

FastAPI + SQLAlchemy + Alembic. SQLite for development/tests; PostgreSQL required in production. See [root README](../README.md), [API](../API.md), [architecture](../ARCHITECTURE.md).

Activate Python 3.12 virtual environment, then from backend:

```sh
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python -m app.seed --file ../src/data/wiki_data.json
uvicorn app.main:app --reload --port 8000
```

PowerShell: Copy-Item .env.example .env. Seed is optional and only accepts an empty database. Startup never creates schema or restores deleted records. Back up existing databases before migrations. Invalid legacy rows abort migration; fix explicitly and retry.

app/config.py owns environment; auth.py verifies Telegram signatures; routers.py handles HTTP; services.py owns transactions; schemas.py defines contracts; models.py defines database constraints. Tests: python -m pytest. Health: /api/health. OpenAPI: /docs.

Production requires APP_ENV=production, PostgreSQL DATABASE_URL, BOT_TOKEN, ADMIN_IDS and exact frontend ALLOWED_ORIGINS. DEV_ADMIN_TOKEN is prohibited in production. No secrets in VITE variables. Run alembic upgrade head before starting uvicorn app.main:app --host 0.0.0.0 --port $PORT in provider shell. Verify readiness before releasing matching frontend.
