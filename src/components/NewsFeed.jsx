import { Radio, ChevronRight } from 'lucide-react'

export default function NewsFeed({ news }) {
  if (!news) return null

  return (
    <div className="panel panel-hover relative overflow-hidden p-4 animate-fade-up">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-qzero/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qzero opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-qzero" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-qzero">последняя Глава</span>
        </div>
        <Radio size={14} className="text-slate-600" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono text-slate-500 mb-1">{news.episode} · {news.date}</p>
          <h3 className="font-display font-semibold text-lg text-slate-50 leading-tight mb-1.5">
            {news.title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">{news.note}</p>
        </div>
      </div>

      <button className="relative mt-3 flex items-center gap-1 text-xs font-medium text-qzero hover:gap-2 transition-all duration-200">
        Читать разбор эпизода
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
