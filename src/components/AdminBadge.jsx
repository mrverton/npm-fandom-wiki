import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function AdminBadge() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/admin')}
      className="flex items-center gap-1.5 rounded-full border border-cortex/50 bg-cortex/10 px-3 py-1.5 text-cortex shadow-neon-cortex active:scale-95 transition-transform animate-pulse-slow"
    >
      <ShieldCheck size={14} strokeWidth={2.4} />
      <span className="text-[11px] font-mono uppercase tracking-widest">Админ</span>
    </button>
  )
}
