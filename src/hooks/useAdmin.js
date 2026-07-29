import { useMemo } from 'react'
import { ADMIN_ID } from '../config'
import { getTelegramUserId } from '../api/client'

/**
 * Проверяет, является ли текущий пользователь Telegram админом вики.
 * Сравнивает window.Telegram.WebApp.initDataUnsafe.user.id с ADMIN_ID.
 */
export function useAdmin() {
  const telegramId = useMemo(() => getTelegramUserId(), [])
  const isAdmin = telegramId !== null && Number(telegramId) === Number(ADMIN_ID)

  return { isAdmin, telegramId }
}
