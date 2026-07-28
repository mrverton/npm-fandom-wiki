import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function TopBar({ title, subtitle, showBack = false, accentClass = 'text-qzero' }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 safe-top">
      <div className="absolute inset-0 bg-base-950/85 backdrop-blur-md border-b border-base-600/40" />
      <div className="relative max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-base-600/60 bg-base-850/70 text-slate-300 hover:text-white hover:border-base-600 active:scale-95 transition-all"
            aria-label="Назад"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-lg text-slate-50 truncate leading-tight">{title}</h1>
          {subtitle && <p className={`text-[11px] font-mono uppercase tracking-widest ${accentClass} truncate`}>{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}
