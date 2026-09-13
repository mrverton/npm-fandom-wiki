import { useContext } from 'react'
import { TelegramContext } from '../context/TelegramContext'

export function useTelegram() {
  const value = useContext(TelegramContext)
  if (!value) throw new Error('useTelegram requires TelegramProvider')
  return value
}
