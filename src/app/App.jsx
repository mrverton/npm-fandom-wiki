import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TelegramNavigation } from '../context/TelegramContext.jsx'
export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return <div className="bg-scan-overlay"><TelegramNavigation /><Outlet /></div>
}
