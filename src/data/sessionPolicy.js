import { config } from '../config/index.js'

// Provenance only, never character data or credentials. Survives refresh in this tab.
const key = `npm-wiki:api-confirmed:${config.apiBaseUrl}`
export function hasSeenApiInSession() {
  try { return sessionStorage.getItem(key) === 'yes' } catch { return false }
}
export function markApiSeenInSession() {
  try { sessionStorage.setItem(key, 'yes') } catch { /* WebViews may disable storage; in-memory guard still applies. */ }
}
