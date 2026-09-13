"""Verify Telegram's signed initData before authorizing any write."""
import hashlib
import hmac
import json
import re
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl
from fastapi import Depends, Header, Request
from .config import Settings
from .exceptions import ApiError


@dataclass(frozen=True)
class Identity:
    user_id: int
    is_admin: bool


def unauthorized():
    return ApiError(401, "AUTHENTICATION_ERROR", "Откройте приложение через Telegram или войдите заново.")


def verify_init_data(raw: str, settings: Settings, now: int | None = None) -> Identity:
    if not settings.bot_token or len(raw) > 16384:
        raise unauthorized()
    try:
        pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True,
                          encoding="utf-8", errors="strict", max_num_fields=30)
        data = dict(pairs)
        if len(pairs) != len(data):
            raise ValueError("duplicate keys")
        supplied_hash = data.pop("hash")
        if not re.fullmatch(r"[a-fA-F0-9]{64}", supplied_hash):
            raise ValueError("invalid hash")
        check = "\n".join(f"{key}={data[key]}" for key in sorted(data))
        secret = hmac.new(b"WebAppData", settings.bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, supplied_hash.lower()):
            raise ValueError("invalid signature")
        auth_date = int(data["auth_date"])
        timestamp = int(time.time()) if now is None else now
        if auth_date > timestamp + 30 or timestamp - auth_date > settings.init_data_max_age_seconds:
            raise ValueError("expired or future initData")
        user = json.loads(data["user"])
        user_id = user["id"]
        if type(user_id) is not int or not 0 < user_id < 2**53:
            raise ValueError("invalid user id")
    except (ValueError, KeyError, TypeError, UnicodeError):
        raise unauthorized() from None
    return Identity(user_id, user_id in settings.admin_ids)


def authenticate(request: Request, x_telegram_init_data: str | None = Header(default=None),
                 authorization: str | None = Header(default=None)) -> Identity:
    settings = request.app.state.settings
    if x_telegram_init_data:
        return verify_init_data(x_telegram_init_data, settings)
    if settings.app_env == "development" and settings.dev_admin_token and authorization:
        expected = f"Bearer {settings.dev_admin_token}"
        if hmac.compare_digest(authorization.encode(), expected.encode()):
            return Identity(settings.dev_admin_user_id, True)
    raise unauthorized()


def require_admin(identity: Identity = Depends(authenticate)) -> Identity:
    if not identity.is_admin:
        raise ApiError(403, "AUTHORIZATION_ERROR", "Недостаточно прав администратора.")
    return identity
