import { Link } from 'react-router-dom'
import { Radio, ChevronRight } from 'lucide-react'

export default function NewsFeed({ news }) {
  if (!news) return <p className="empty-state">Новостей пока нет.</p>
  return (
    <article className="panel relative overflow-hidden p-4">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-qzero/10 blur-3xl pointer-events-none" />
      <div className="relative flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-widest text-qzero">{news.marker || 'Новости вики'}</span>
        <Radio size={14} className="text-slate-500" />
      </div>
      <div className="relative">
        <p className="text-[11px] font-mono text-slate-400 mb-1">{news.episode} · {news.date}</p>
        <h3 className="font-display font-semibold text-lg text-slate-50 leading-tight mb-1.5">{news.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{news.note}</p>
        <Link to="/arcs" className="mt-3 min-h-control inline-flex items-center gap-1 text-xs font-medium text-qzero">Читать разбор эпизода<ChevronRight size={14} /></Link>
      </div>
    </article>
  )
}
