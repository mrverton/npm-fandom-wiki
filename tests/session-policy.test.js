import { describe, expect, it, vi } from 'vitest'
import { hasSeenApiInSession, markApiSeenInSession } from '../src/data/sessionPolicy.js'

describe('refresh provenance policy', () => {
  it('persists only successful API provenance, without catalog or credentials', () => {
    expect(hasSeenApiInSession()).toBe(false)
    markApiSeenInSession()
    expect(hasSeenApiInSession()).toBe(true)
    expect(sessionStorage.length).toBe(1)
    const key = sessionStorage.key(0)
    expect(key).toBe('npm-wiki:api-confirmed:/api')
    expect(sessionStorage.getItem(key)).toBe('yes')
  })

  it('disabled WebView storage cannot crash loading or its success handler', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
    expect(hasSeenApiInSession()).toBe(false)
    expect(() => markApiSeenInSession()).not.toThrow()
  })
})
