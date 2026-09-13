"""Application composition. Startup never modifies schema or seeds records."""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from .config import Settings
from .database import build_engine, build_session_factory
from .exceptions import ApiError, error_response, register_handlers
from .routers import router
from .services import check_database


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    engine = build_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(_app):
        try:
            with engine.connect() as connection:
                check_database(connection)
        except SQLAlchemyError:
            engine.dispose()
            raise RuntimeError("Database unavailable or schema missing. Run `python -m alembic upgrade head` before starting the API.") from None
        try:
            yield
        finally:
            engine.dispose()

    app = FastAPI(title="НПМ Фандом Вики API", version="2.0.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = build_session_factory(engine)
    register_handlers(app)
    app.include_router(router)

    @app.middleware("http")
    async def no_cache(request, call_next):
        try:
            response = await call_next(request)
        except Exception as error:
            # Handle unexpected failures inside CORS, so browsers can read JSON 500.
            logging.getLogger(__name__).error("Unexpected request failure (%s)", type(error).__name__)
            response = error_response(ApiError(500, "SERVER_ERROR", "Не удалось выполнить запрос. Попробуйте позже."))
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins),
                       allow_credentials=False,
                       allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                       allow_headers=["Content-Type", "X-Telegram-Init-Data", "Authorization", "If-Match"],
                       max_age=600)

    @app.get("/", include_in_schema=False)
    def root():
        return {"status": "ok", "service": "npm-fandom-wiki-api", "health": "/api/health"}

    return app


app = create_app()
