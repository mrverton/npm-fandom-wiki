import { API_BASE_URL } from '../config'

/**
 * Достаёт Telegram ID текущего пользователя из Telegram WebApp SDK.
 * Вне Telegram (обычный браузер, локальная разработка) вернёт null.
 */
function getTelegramUserId() {
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null
  } catch {
    return null
  }
}

async function request(
    path,
    {
      method = 'GET',
      body,
      requireAuth = false,
    } = {},
) {
  const headers = {}

  // Content-Type нужен только когда реально отправляем JSON.
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (requireAuth) {
    const userId = getTelegramUserId()

    if (userId) {
      headers['X-Telegram-User-Id'] = String(userId)
    }
  }

  const url = `${API_BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = `Ошибка запроса (${res.status})`

    try {
      const errJson = await res.json()

      if (errJson?.detail) {
        detail =
            typeof errJson.detail === 'string'
                ? errJson.detail
                : JSON.stringify(errJson.detail)
      }
    } catch {
      // Ответ не JSON — оставляем стандартное сообщение.
    }

    const error = new Error(detail)
    error.status = res.status

    throw error
  }

  // DELETE может вернуть 204 No Content.
  if (res.status === 204) {
    return null
  }

  // Защита от пустого ответа.
  const text = await res.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  getCharacters: () =>
      request('/api/characters'),

  getCharacter: (id) =>
      request(`/api/characters/${id}`),

  createCharacter: (payload) =>
      request('/api/characters', {
        method: 'POST',
        body: payload,
        requireAuth: true,
      }),

  updateCharacter: (id, payload) =>
      request(`/api/characters/${id}`, {
        method: 'PUT',
        body: payload,
        requireAuth: true,
      }),

  deleteCharacter: (id) =>
      request(`/api/characters/${id}`, {
        method: 'DELETE',
        requireAuth: true,
      }),
}

export { getTelegramUserId }