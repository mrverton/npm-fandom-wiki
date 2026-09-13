"""Consistent public errors; internal exceptions are never sent to clients."""
import logging
from fastapi import Request
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm.exc import StaleDataError
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, fields: list | None = None):
        self.status, self.code, self.message, self.fields = status, code, message, fields
        super().__init__(message)


def error_response(error: ApiError):
    detail = {"code": error.code, "message": error.message}
    if error.fields:
        detail["fields"] = error.fields
    headers = {"Cache-Control": "no-store"}
    if error.status == 401:
        headers["WWW-Authenticate"] = "TelegramInitData"
    return JSONResponse({"error": detail}, status_code=error.status, headers=headers)


def register_handlers(app):
    @app.exception_handler(ApiError)
    async def api_error(_request: Request, error: ApiError):
        return error_response(error)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, error: RequestValidationError):
        fields = [{"field": ".".join(str(part) for part in item["loc"] if part not in {"body", "path", "header", "query"}),
                   "message": item["msg"]} for item in error.errors()]
        return error_response(ApiError(422, "VALIDATION_ERROR", "Проверьте заполненные поля.", fields))

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException):
        code = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(error.status_code, "REQUEST_ERROR")
        return error_response(ApiError(error.status_code, code, "Адрес не найден." if error.status_code == 404 else "Запрос не поддерживается."))

    @app.exception_handler(IntegrityError)
    async def integrity_error(_request: Request, _error: IntegrityError):
        return error_response(ApiError(409, "CONFLICT", "Данные конфликтуют с существующей записью. Проверьте уникальность slug."))

    @app.exception_handler(StaleDataError)
    async def stale_error(_request: Request, _error: StaleDataError):
        return error_response(ApiError(409, "CONFLICT", "Запись уже изменена. Обновите данные перед сохранением."))

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_request: Request, error: SQLAlchemyError):
        logger.error("Database operation failed (%s)", type(error).__name__)
        return error_response(ApiError(503, "SERVICE_UNAVAILABLE", "База данных временно недоступна. Попробуйте позже."))

    @app.exception_handler(ResponseValidationError)
    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, error: Exception):
        logger.error("Unexpected request failure (%s)", type(error).__name__)
        return error_response(ApiError(500, "SERVER_ERROR", "Не удалось выполнить запрос. Попробуйте позже."))
