import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import { TelegramNavigation, TelegramProvider } from '../src/context/TelegramContext.jsx'
import { useTelegram } from '../src/hooks/useTelegram.js'

afterEach(() => { delete window.Telegram })

function makeTelegram(extra = {}) {
  const handlers = new Map()
  const tg = {
    initData: 'signed-data', colorScheme: 'light', viewportStableHeight: 650,
    safeAreaInset: { top: 30, bottom: 12, left: 0, right: 0 },
    contentSafeAreaInset: { top: 40, bottom: 0, left: 0, right: 0 },
    ready: vi.fn(), expand: vi.fn(), isVersionAtLeast: vi.fn(() => true),
    setHeaderColor: vi.fn(), setBackgroundColor: vi.fn(), setBottomBarColor: vi.fn(),
    onEvent: vi.fn((event, callback) => handlers.set(event, callback)),
    offEvent: vi.fn((event, callback) => { if (handlers.get(event) === callback) handlers.delete(event) }),
    HapticFeedback: { selectionChanged: vi.fn(), impactOccurred: vi.fn() },
    BackButton: { show: vi.fn(), hide: vi.fn(), onClick: vi.fn(), offClick: vi.fn() },
    ...extra,
  }
  window.Telegram = { WebApp: tg }
  return { tg, handlers }
}

function Probe() {
  const telegram = useTelegram()
  return <>
    <output>{telegram.isTelegram ? 'Telegram' : 'Browser'}:{telegram.colorScheme}</output>
    <button onClick={() => telegram.hapticSelect()}>Selection</button>
    <button onClick={() => telegram.hapticImpact('medium')}>Impact</button>
  </>
}

describe('Telegram native lifecycle', () => {
  it('initializes once under StrictMode and removes matching native subscriptions and CSS on unmount', () => {
    const { tg, handlers } = makeTelegram()
    const view = render(<StrictMode><TelegramProvider><Probe /></TelegramProvider></StrictMode>)
    expect(tg.ready).toHaveBeenCalledTimes(1)
    expect(tg.expand).toHaveBeenCalledTimes(1)
    expect(handlers.size).toBe(4)
    expect(screen.getByText('Telegram:light')).toBeInTheDocument()
    const root = document.documentElement
    expect(root.style.getPropertyValue('--app-viewport-height')).toBe('650px')
    expect(root.style.getPropertyValue('--app-safe-top')).toBe('70px')
    expect(root.style.getPropertyValue('--app-safe-bottom')).toBe('12px')
    expect(root.dataset.telegramTheme).toBe('light')
    act(() => {
      tg.colorScheme = 'dark'
      tg.viewportStableHeight = 720
      tg.contentSafeAreaInset.top = 20
      handlers.get('viewportChanged')()
    })
    expect(screen.getByText('Telegram:dark')).toBeInTheDocument()
    expect(root.style.getPropertyValue('--app-viewport-height')).toBe('720px')
    expect(root.style.getPropertyValue('--app-safe-top')).toBe('50px')
    fireEvent.click(screen.getByRole('button', { name: 'Selection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Impact' }))
    expect(tg.HapticFeedback.selectionChanged).toHaveBeenCalledTimes(1)
    expect(tg.HapticFeedback.impactOccurred).toHaveBeenCalledWith('medium')
    view.unmount()
    expect(handlers.size).toBe(0)
    for (const [event, callback] of tg.onEvent.mock.calls) expect(tg.offEvent).toHaveBeenCalledWith(event, callback)
    expect(root.style.getPropertyValue('--app-viewport-height')).toBe('')
    expect(root.style.getPropertyValue('--app-safe-top')).toBe('')
    expect(root.dataset.telegramTheme).toBeUndefined()
  })

  it.each([false, true])('works in a browser with Telegram SDK present=%s but without initData', sdkPresent => {
    const native = sdkPresent ? makeTelegram({ initData: '' }).tg : null
    render(<TelegramProvider><Probe /></TelegramProvider>)
    expect(screen.getByText(/Browser:/)).toBeInTheDocument()
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Selection' }))
      fireEvent.click(screen.getByRole('button', { name: 'Impact' }))
    }).not.toThrow()
    if (native) {
      expect(native.ready).not.toHaveBeenCalled()
      expect(native.expand).not.toHaveBeenCalled()
      expect(native.onEvent).not.toHaveBeenCalled()
      expect(native.HapticFeedback.selectionChanged).not.toHaveBeenCalled()
    }
  })

  it('unsupported native enhancements cannot crash a valid Mini App session', () => {
    const unsupported = vi.fn(() => { throw new Error('Unsupported native version') })
    makeTelegram({ ready: unsupported, expand: unsupported, setHeaderColor: unsupported, HapticFeedback: { selectionChanged: unsupported, impactOccurred: unsupported } })
    render(<TelegramProvider><Probe /></TelegramProvider>)
    expect(screen.getByText('Telegram:light')).toBeInTheDocument()
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Impact' }))).not.toThrow()
  })

  it('skips version-gated UI calls for older SDKs', () => {
    const { tg } = makeTelegram({ isVersionAtLeast: () => false })
    render(<TelegramProvider><Probe /></TelegramProvider>)
    expect(tg.ready).toHaveBeenCalledTimes(1)
    expect(tg.setHeaderColor).not.toHaveBeenCalled()
    expect(tg.setBottomBarColor).not.toHaveBeenCalled()
  })

  it('native back on a direct profile entry opens the catalog and hides the native button at home', async () => {
    const { tg } = makeTelegram()
    function Route() { const location = useLocation(); return <><TelegramNavigation /><output>{location.pathname}</output></> }
    const router = createMemoryRouter([{ path: '*', element: <Route /> }], { initialEntries: ['/characters/verton'] })
    const view = render(<TelegramProvider><RouterProvider router={router} /></TelegramProvider>)
    expect(tg.BackButton.show).toHaveBeenCalled()
    const firstHandler = tg.BackButton.onClick.mock.lastCall[0]
    await act(async () => firstHandler())
    expect(screen.getByText('/characters')).toBeInTheDocument()
    expect(tg.BackButton.offClick).toHaveBeenCalledWith(firstHandler)
    await act(async () => router.navigate('/'))
    expect(tg.BackButton.hide).toHaveBeenCalled()
    const lastHandler = tg.BackButton.onClick.mock.lastCall[0]
    view.unmount()
    expect(tg.BackButton.offClick).toHaveBeenCalledWith(lastHandler)
    router.dispose()
  })
})
