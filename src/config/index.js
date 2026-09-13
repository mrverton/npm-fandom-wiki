/** The only environment-dependent frontend configuration. No server secrets belong here. */
export function createConfig(env = {}) {
  const production = env.PROD === true || env.MODE === 'production'
  const raw = String(env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '')
  let apiBaseUrl = raw
  if (raw !== '/api') {
    let url
    try { url = new URL(raw) } catch { throw new Error('VITE_API_BASE_URL должен быть URL backend или /api') }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Некорректный VITE_API_BASE_URL')
    const local = /^(localhost|127(?:\.\d+){3}|\[::1\]|0\.0\.0\.0)$/.test(url.hostname)
    if (production && (local || url.protocol !== 'https:')) throw new Error('Production API требует публичный HTTPS URL или /api')
    if (!['/', '/api'].includes(url.pathname)) throw new Error('URL backend должен заканчиваться на /api или не иметь пути')
    apiBaseUrl = `${url.origin}/api`
  }
  const timeoutMs = Number(env.VITE_API_TIMEOUT_MS || 20000)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) throw new Error('VITE_API_TIMEOUT_MS должен быть целым числом от 1000 до 120000')
  return Object.freeze({ apiBaseUrl, timeoutMs, development: !production && env.MODE !== 'test' })
}

export const config = createConfig(import.meta.env)
