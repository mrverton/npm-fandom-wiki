let developmentToken = ''
// A manually supplied local-development credential stays only in memory.
export function setDevelopmentToken(token) { developmentToken = token.trim() }
export function clearCredentials() { developmentToken = '' }
export function getAuthHeaders() {
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData : ''
  if (initData) return { 'X-Telegram-Init-Data': initData }
  if (developmentToken) return { Authorization: `Bearer ${developmentToken}` }
  return {}
}
export function hasCredentials() { return Object.keys(getAuthHeaders()).length > 0 }
