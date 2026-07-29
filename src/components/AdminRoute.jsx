import { Navigate } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin'

/**
 * Пропускает внутрь только если текущий Telegram-пользователь — админ.
 * Это UX-защита (скрыть UI от обычных пользователей); настоящая защита
 * данных — на бэкенде, в auth.py.
 */
export default function AdminRoute({ children }) {
  const { isAdmin } = useAdmin()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
