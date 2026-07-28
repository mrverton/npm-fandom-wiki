import { NavLink } from 'react-router-dom'
import { Home, Users, Clock, BookOpen } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

const TABS = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/characters', label: 'Персонажи', icon: Users },
  { to: '/timeline', label: 'Хронология', icon: Clock },
  { to: '/arcs', label: 'Арки', icon: BookOpen },
]

export default function BottomNav() {
  const { hapticSelect } = useTelegram()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="absolute inset-0 bg-base-900/90 backdrop-blur-lg border-t border-base-600/50" />
      <div className="relative max-w-lg mx-auto grid grid-cols-4 px-2 pt-2 pb-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={hapticSelect}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors duration-200 ${
                isActive ? 'text-qzero' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-2 h-0.5 w-8 rounded-full bg-qzero shadow-neon-qzero" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} className={isActive ? 'drop-shadow-[0_0_6px_rgba(47,214,255,0.7)]' : ''} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
