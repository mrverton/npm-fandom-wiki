import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../src/api/client.js'
import { AuthenticationError, AuthorizationError, ConflictError, ContractError, NetworkError, NotFoundError, ServerError, TimeoutError, ValidationError, normalizeError } from '../src/api/errors.js'

function setup(fetchFn, options = {}) {
  return createApiClient({ baseUrl: 'https://api.example.com/api/', fetchFn, timeoutMs: 1000, getAuthHeaders: () => ({}), ...options })
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

describe('HTTP transport contract', () => {
  it('joins the configured URL, sends JSON only for bodies and forbids cached reads/cookies/redirects', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(json([])))
    const client = setup(fetchFn)
    await expect(client.request('/characters')).resolves.toEqual([])
    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/characters', expect.objectContaining({
      method: 'GET', body: undefined, credentials: 'omit', cache: 'no-store', redirect: 'error',
    }))
    expect(fetchFn.mock.calls[0][1].headers).not.toHaveProperty('Content-Type')
    await client.request('/characters', { method: 'POST', body: { name: 'Вертон' } })
    expect(fetchFn.mock.calls[1][1]).toMatchObject({ headers: { 'Content-Type': 'application/json' }, body: '{"name":"Вертон"}' })
  })

  it('handles DELETE 204 and empty body without attempting JSON parsing', async () => {
    const client = setup(vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response('')))
    await expect(client.request('/characters/1', { method: 'DELETE' })).resolves.toBeNull()
    await expect(client.request('/characters')).resolves.toBeNull()
  })

  it('rejects invalid successful JSON rather than returning a string to UI', async () => {
    await expect(setup(() => Promise.resolve(new Response('<html>proxy</html>'))).request('/characters')).rejects.toBeInstanceOf(ContractError)
  })

  it.each([[401, AuthenticationError], [403, AuthorizationError], [404, NotFoundError], [409, ConflictError], [422, ValidationError], [500, ServerError]])('normalizes HTTP %s and preserves server messages', async (status, Type) => {
    const client = setup(() => Promise.resolve(json({ error: { code: 'test_error', message: 'Понятное сообщение сервера' } }, status)))
    const error = await client.request('/characters').catch(error => error)
    expect(error).toBeInstanceOf(Type)
    expect(error).toMatchObject({ status, code: 'test_error', message: 'Понятное сообщение сервера' })
  })

  it('maps legacy FastAPI validation errors to field errors and handles a non-JSON 500', async () => {
    const client = setup(vi.fn().mockResolvedValueOnce(json({ detail: [{ loc: ['body', 'name'], msg: 'Field required' }] }, 422)).mockResolvedValueOnce(new Response('gateway internal details', { status: 500 })))
    await expect(client.request('/characters')).rejects.toMatchObject({ fields: [{ field: 'name', message: 'Field required' }] })
    const error = await client.request('/characters').catch(error => error)
    expect(error).toBeInstanceOf(ServerError)
    expect(error.message).not.toContain('gateway internal details')
  })

  it('requires credentials before transport and transmits signed initData, never unverified user ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ ok: true }))
    await expect(setup(fetchFn).request('/characters', { requireAuth: true })).rejects.toBeInstanceOf(AuthenticationError)
    expect(fetchFn).not.toHaveBeenCalled()
    await setup(fetchFn, { getAuthHeaders: () => ({ 'X-Telegram-Init-Data': 'signed-data' }) }).request('/characters', { requireAuth: true })
    expect(fetchFn.mock.calls[0][1].headers).toMatchObject({ 'X-Telegram-Init-Data': 'signed-data' })
    expect(fetchFn.mock.calls[0][1].headers).not.toHaveProperty('X-Telegram-User-Id')
  })

  it('turns network failures into readable errors', async () => {
    const error = await setup(() => Promise.reject(new TypeError('Failed to fetch'))).request('/characters').catch(error => error)
    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).not.toBe('Failed to fetch')
    expect(normalizeError(error)).toBe(error)
  })

  it('passes cancellation through, including a pre-aborted request', async () => {
    const controller = new AbortController()
    const fetchFn = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))))
    const result = setup(fetchFn).request('/characters', { signal: controller.signal }).catch(error => error)
    controller.abort()
    expect(await result).toMatchObject({ name: 'AbortError' })
    const untouched = vi.fn()
    await expect(setup(untouched).request('/characters', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(untouched).not.toHaveBeenCalled()
  })

  it('aborts a timed-out request and clears request timers after completion', async () => {
    vi.useFakeTimers()
    const fetchFn = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))))
    const pending = setup(fetchFn).request('/characters').catch(error => error)
    await vi.advanceTimersByTimeAsync(1000)
    expect(await pending).toBeInstanceOf(TimeoutError)
    expect(fetchFn.mock.calls[0][1].signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
