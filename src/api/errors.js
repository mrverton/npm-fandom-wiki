const MESSAGES = {
  401: 'Сессия недействительна или истекла. Откройте Mini App заново.',
  403: 'У вас нет прав администратора.',
  404: 'Персонаж не найден. Обновите каталог.',
  409: 'Данные изменились. Обновите каталог перед повторным сохранением.',
  422: 'Проверьте заполнение полей.',
}
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'unknown_error', fields = [], cause } = {}) {
    super(message, { cause })
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.fields = fields
  }
}
export class NetworkError extends ApiError {}
export class TimeoutError extends NetworkError {}
export class AuthenticationError extends ApiError {}
export class AuthorizationError extends ApiError {}
export class ValidationError extends ApiError {}
export class NotFoundError extends ApiError {}
export class ConflictError extends ApiError {}
export class ServerError extends ApiError {}
export class ContractError extends ApiError {}
export class UnknownError extends ApiError {}

export function fromHttpError(status, payload) {
  const Type = ({ 401: AuthenticationError, 403: AuthorizationError, 404: NotFoundError, 409: ConflictError, 422: ValidationError })[status] || (status >= 500 ? ServerError : UnknownError)
  const detail = payload?.error?.message ?? payload?.detail
  const message = typeof detail === 'string' && detail.length <= 1500 ? detail : MESSAGES[status] || (status >= 500 ? 'Сервер временно недоступен. Попробуйте обновить данные.' : `Не удалось выполнить запрос (${status}).`)
  const fields = Array.isArray(payload?.error?.fields) ? payload.error.fields : Array.isArray(payload?.detail) ? payload.detail.map(item => ({ field: item.loc?.filter(x => x !== 'body').join('.'), message: item.msg })) : []
  return new Type(message, { status, code: payload?.error?.code || `http_${status}`, fields })
}
export function normalizeError(error) {
  if (error instanceof ApiError || error?.name === 'AbortError') return error
  return new UnknownError('Не удалось выполнить операцию. Повторите попытку.', { cause: error })
}
export function canUseFallback(error) { return error instanceof NetworkError || error instanceof ServerError }
