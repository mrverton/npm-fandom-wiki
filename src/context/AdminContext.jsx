import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authApi } from '../api/auth.js'
import { clearCredentials, hasCredentials, setDevelopmentToken } from '../api/credentials.js'
import { normalizeError } from '../api/errors.js'
import { config } from '../config/index.js'

const AdminContext = createContext(null)
export function AdminProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', isAdmin: false, telegramId: null, error: null })
  const request = useRef(null)
  const sequence = useRef(0)
  const verify = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const current = ++sequence.current
    if (!hasCredentials()) {
      setState({ status: 'anonymous', isAdmin: false, telegramId: null, error: null })
      return
    }
    setState({ status: 'loading', isAdmin: false, telegramId: null, error: null })
    try {
      const session = await authApi.session({ signal: controller.signal })
      if (!controller.signal.aborted && sequence.current === current) setState({ status: 'authenticated', isAdmin: session.isAdmin, telegramId: session.userId, error: null })
    } catch (error) {
      if (!controller.signal.aborted && sequence.current === current) setState({ status: 'error', isAdmin: false, telegramId: null, error: normalizeError(error) })
    }
  }, [])
  useEffect(() => { verify(); return () => { sequence.current += 1; request.current?.abort() } }, [verify])
  const login = async token => {
    if (!config.development) return
    setDevelopmentToken(token)
    await verify()
  }
  const logout = () => {
    sequence.current += 1
    request.current?.abort()
    clearCredentials()
    setState({ status: 'anonymous', isAdmin: false, telegramId: null, error: null })
  }
  return <AdminContext.Provider value={{ ...state, login, logout, verify, development: config.development }}>{children}</AdminContext.Provider>
}
export function useAdminContext() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin requires AdminProvider')
  return context
}
