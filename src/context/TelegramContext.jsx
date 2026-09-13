import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBackNavigation } from '../hooks/useBackNavigation'
import { palette } from '../styles/tokens'

export const TelegramContext = createContext(null)
const initialized = new WeakSet()

// Some older WebViews expose methods that still throw for unsupported versions.
function safely(action) { try { action?.() } catch { /* Native enhancement is optional. */ } }

function supports(tg, version) {
  return Boolean(tg?.initData) && (typeof tg.isVersionAtLeast !== 'function' || tg.isVersionAtLeast(version))
}

function snapshot(tg) {
  return { colorScheme: tg?.colorScheme ?? 'dark', user: tg?.initDataUnsafe?.user ?? null, isTelegram: Boolean(tg?.initData) }
}

export function TelegramProvider({ children }) {
  const [tg] = useState(() => typeof window !== 'undefined' ? window.Telegram?.WebApp ?? null : null)
  const [native, setNative] = useState(() => snapshot(tg))

  useEffect(() => {
    if (!tg?.initData) return
    const root = document.documentElement
    const sync = () => {
      setNative(snapshot(tg))
      root.dataset.telegramTheme = tg.colorScheme ?? 'dark'
      const height = Number(tg.viewportStableHeight)
      if (height > 0) root.style.setProperty('--app-viewport-height', `${height}px`)
      for (const side of ['top', 'bottom', 'left', 'right']) {
        const system = Math.max(0, Number(tg.safeAreaInset?.[side]) || 0)
        const content = Math.max(0, Number(tg.contentSafeAreaInset?.[side]) || 0)
        root.style.setProperty(`--app-safe-${side}`, `${system + content}px`)
      }
      // The wiki has an intentional dark art direction in either Telegram theme.
      if (supports(tg, '6.1')) {
        safely(() => tg.setHeaderColor?.(supports(tg, '6.9') ? palette.base[900] : 'bg_color'))
        safely(() => tg.setBackgroundColor?.(palette.base[950]))
      }
      if (supports(tg, '7.10')) safely(() => tg.setBottomBarColor?.(palette.base[900]))
    }
    if (!initialized.has(tg)) {
      initialized.add(tg)
      safely(() => tg.ready?.())
      safely(() => tg.expand?.())
    }
    sync()
    const events = ['themeChanged', 'viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged']
    events.forEach((event) => safely(() => tg.onEvent?.(event, sync)))
    return () => {
      events.forEach((event) => safely(() => tg.offEvent?.(event, sync)))
      root.style.removeProperty('--app-viewport-height')
      for (const side of ['top', 'bottom', 'left', 'right']) root.style.removeProperty(`--app-safe-${side}`)
      delete root.dataset.telegramTheme
    }
  }, [tg])

  const value = useMemo(() => ({
    tg, ...native,
    hapticSelect: () => { if (supports(tg, '6.1')) safely(() => tg.HapticFeedback?.selectionChanged?.()) },
    hapticImpact: (style = 'light') => { if (supports(tg, '6.1')) safely(() => tg.HapticFeedback?.impactOccurred?.(style)) },
    setClosingConfirmation: (enabled) => {
      if (supports(tg, '6.2')) safely(() => enabled ? tg.enableClosingConfirmation?.() : tg.disableClosingConfirmation?.())
    },
  }), [tg, native])

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}

/** Mount once inside the router; native and in-page back share one policy. */
export function TelegramNavigation() {
  const { tg } = useContext(TelegramContext)
  const { pathname } = useLocation()
  const goBack = useBackNavigation()
  useEffect(() => {
    const back = tg?.BackButton
    if (!back || !supports(tg, '6.1')) return
    safely(() => pathname === '/' ? back.hide?.() : back.show?.())
    safely(() => back.onClick?.(goBack))
    return () => {
      safely(() => back.offClick?.(goBack))
      safely(() => back.hide?.())
    }
  }, [tg, pathname, goBack])
  return null
}
