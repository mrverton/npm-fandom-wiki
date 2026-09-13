import { useCallback, useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { useTelegram } from './useTelegram.js'

export function useUnsavedChanges(enabled) {
  const { setClosingConfirmation } = useTelegram()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => enabled && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useBeforeUnload(useCallback(event => {
    if (!enabled) return
    event.preventDefault()
    event.returnValue = ''
  }, [enabled]))
  useEffect(() => {
    if (!enabled) return
    setClosingConfirmation?.(true)
    return () => setClosingConfirmation?.(false)
  }, [enabled, setClosingConfirmation])
  return blocker
}
