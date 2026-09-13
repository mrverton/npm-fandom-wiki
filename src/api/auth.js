import { client } from './client.js'
import { ContractError } from './errors.js'
export const authApi = {
  async session(options) {
    const data = await client.request('/auth/session', { ...options, requireAuth: true })
    if (!data || !Number.isSafeInteger(data.userId) || data.userId < 1 || typeof data.isAdmin !== 'boolean') throw new ContractError('Сервер вернул некорректные данные сессии.')
    return data
  },
}
