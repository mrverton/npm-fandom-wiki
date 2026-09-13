import { config } from '../config/index.js'
import { getAuthHeaders as readAuthHeaders } from './credentials.js'
import { AuthenticationError, ContractError, NetworkError, TimeoutError, fromHttpError } from './errors.js'

/** Transport only. Endpoint methods and response contracts live in separate modules. */
export function createApiClient({ baseUrl = config.apiBaseUrl, getAuthHeaders = readAuthHeaders, timeoutMs = config.timeoutMs, fetchFn = (...args) => fetch(...args) } = {}) {
  async function request(path, { method = 'GET', body, signal, requireAuth = false, headers: extraHeaders = {} } = {}) {
    const headers = { Accept: 'application/json', ...extraHeaders }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (requireAuth) {
      const authHeaders = getAuthHeaders()
      if (!Object.keys(authHeaders).length) throw new AuthenticationError('Откройте приложение в Telegram или войдите в локальную админку.', { status: 401 })
      Object.assign(headers, authHeaders)
    }
    const controller = new AbortController()
    let timedOut = false
    const abort = () => controller.abort()
    if (signal?.aborted) controller.abort()
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
    try {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const response = await fetchFn(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
        credentials: 'omit', cache: 'no-store', redirect: 'error',
      })
      if (response.status === 204 && response.ok) return null
      const text = await response.text()
      let data = null
      if (text) {
        try { data = JSON.parse(text) } catch {
          if (response.ok) throw new ContractError('Сервер вернул некорректные данные. Обновите приложение.', { status: response.status })
        }
      }
      if (!response.ok) throw fromHttpError(response.status, data)
      return data
    } catch (error) {
      if (timedOut) throw new TimeoutError('Сервер не ответил вовремя. Проверьте соединение и обновите данные.', { code: 'timeout', cause: error })
      if (signal?.aborted || error?.name === 'AbortError') throw new DOMException('Aborted', 'AbortError')
      if (error instanceof TypeError) throw new NetworkError('Нет связи с сервером. Проверьте соединение и повторите запрос.', { code: 'network_error', cause: error })
      throw error
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    }
  }
  return { request }
}
export const client = createApiClient()
