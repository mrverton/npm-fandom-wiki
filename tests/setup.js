import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  window.sessionStorage.clear()
})

// jsdom has no visual layout; individual lifecycle tests assert subscriptions.
window.matchMedia ??= () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
})
window.ResizeObserver ??= class {
  observe() {}
  disconnect() {}
}
