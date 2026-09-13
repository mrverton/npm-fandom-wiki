import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useBackNavigation() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
      return
    }
    const parent = pathname.startsWith('/characters/') ? '/characters'
      : pathname.startsWith('/admin/') ? '/admin' : '/'
    navigate(parent, { replace: true })
  }, [navigate, pathname])
}
