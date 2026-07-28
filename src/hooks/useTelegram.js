import { useEffect, useMemo } from 'react'

// Thin wrapper around the Telegram Web App SDK (window.Telegram.WebApp).
// Safe to use outside Telegram too — falls back to no-ops so the app
// still runs normally in a regular browser during development.
export function useTelegram() {
  const tg = useMemo(() => (typeof window !== 'undefined' ? window.Telegram?.WebApp : null), [])

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
    try {
      tg.setHeaderColor?.('#0d0f14')
      tg.setBackgroundColor?.('#08090c')
    } catch (e) {
      // older client versions may not support these calls
    }
  }, [tg])

  const hapticSelect = () => {
    try {
      tg?.HapticFeedback?.selectionChanged()
    } catch (e) {
      /* noop */
    }
  }

  const hapticImpact = (style = 'light') => {
    try {
      tg?.HapticFeedback?.impactOccurred(style)
    } catch (e) {
      /* noop */
    }
  }

  return { tg, hapticSelect, hapticImpact }
}
