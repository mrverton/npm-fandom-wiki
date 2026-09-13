"""Environment configuration. No credentials belong in the frontend bundle."""
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    app_env: str = "development"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'npm_wiki.db').as_posix()}"
    allowed_origins: tuple[str, ...] = ("http://localhost:5173", "http://127.0.0.1:5173")
    bot_token: str = ""
    admin_ids: frozenset[int] = frozenset()
    init_data_max_age_seconds: int = 3600
    dev_admin_token: str = ""
    dev_admin_user_id: int = 1

    def __post_init__(self):
        if self.app_env not in {"development", "production", "test"}:
            raise ValueError("APP_ENV must be development, production or test")
        if not self.database_url.startswith(("sqlite:///", "postgresql://", "postgresql+psycopg2://")):
            raise ValueError("DATABASE_URL must use SQLite or PostgreSQL")
        if not 60 <= self.init_data_max_age_seconds <= 86400:
            raise ValueError("INIT_DATA_MAX_AGE_SECONDS must be between 60 and 86400")
        if any(type(value) is not int or not 0 < value < 2**53 for value in self.admin_ids):
            raise ValueError("ADMIN_IDS must contain positive integer Telegram IDs")
        if type(self.dev_admin_user_id) is not int or not 0 < self.dev_admin_user_id < 2**53:
            raise ValueError("DEV_ADMIN_USER_ID must be a positive integer")
        for origin in self.allowed_origins:
            url = urlsplit(origin)
            if (url.scheme not in {"http", "https"} or not url.hostname or url.username
                    or url.password or url.path or url.query or url.fragment or "*" in origin):
                raise ValueError("ALLOWED_ORIGINS must contain exact origins without path or wildcard")
        if self.dev_admin_token and (self.app_env != "development" or len(self.dev_admin_token) < 24):
            raise ValueError("DEV_ADMIN_TOKEN needs at least 24 characters and APP_ENV=development")
        if self.app_env == "production":
            if not self.database_url.startswith(("postgresql://", "postgresql+psycopg2://")):
                raise ValueError("Production requires a persistent PostgreSQL DATABASE_URL")
            if not self.bot_token or not self.admin_ids:
                raise ValueError("Production requires BOT_TOKEN and ADMIN_IDS")
            if not self.allowed_origins or any(
                urlsplit(origin).scheme != "https" or urlsplit(origin).hostname in {"localhost", "127.0.0.1", "::1"}
                for origin in self.allowed_origins
            ):
                raise ValueError("Production requires explicit HTTPS ALLOWED_ORIGINS")

    @classmethod
    def from_env(cls):
        load_dotenv(BACKEND_DIR / ".env", override=False)
        environment = os.getenv("APP_ENV", "development")
        database_url = os.getenv("DATABASE_URL", cls.database_url)
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        origins_default = "" if environment == "production" else ",".join(cls.allowed_origins)
        return cls(
            app_env=environment, database_url=database_url,
            allowed_origins=tuple(part.strip() for part in os.getenv("ALLOWED_ORIGINS", origins_default).split(",") if part.strip()),
            bot_token=os.getenv("BOT_TOKEN", "").strip(),
            admin_ids=frozenset(int(part.strip()) for part in os.getenv("ADMIN_IDS", "").split(",") if part.strip()),
            init_data_max_age_seconds=int(os.getenv("INIT_DATA_MAX_AGE_SECONDS", "3600")),
            dev_admin_token=os.getenv("DEV_ADMIN_TOKEN", ""),
            dev_admin_user_id=int(os.getenv("DEV_ADMIN_USER_ID", "1")),
        )
