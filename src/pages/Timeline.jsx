import { Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import wikiData from '../data/wiki_data.json'

const EPISODES = [
  {
    id: 'ep1',
    number: 'Эпизод 1',
    title: 'Детство',
    date: 'Премьера',
    color: 'text-verton',
    dot: 'bg-verton',
    border: 'border-verton/40',
    summary: 'Юный Вертон собирает первую версию Ядра в заброшенном дата-центре и активирует безымянный фрагмент кода, которому позже даст имя Кьюзеро. Наставник Тертон обучает его основам архитектуры, но после финала серии связь с ним обрывается.',
    featured: ['verton', 'qzero', 'terton'],
  },
  {
    id: 'ep2',
    number: 'Эпизод 2',
    title: 'Bloodness Income',
    date: '12 июля 2026',
    color: 'text-qzero',
    dot: 'bg-qzero',
    border: 'border-qzero/40',
    summary: 'Консорциум Кортекса организует враждебное поглощение Ядра, переименовывая его в коммерческую платформу «Bloodness». Кьюзеро принимает сделку и становится смотрителем реестра, а Вертон уходит в подполье.',
    featured: ['verton', 'qzero', 'cortex'],
  },
]

export default function Timeline() {
  return (
    <Layout
      header={<TopBar title="Хронология серий" subtitle="npm — timeline" showBack accentClass="text-qzero" />}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 mb-3 animate-fade-up">
          <Clock size={14} className="text-slate-500" />
          <p className="text-xs text-slate-500">Последнее обновление: {wikiData.series.latestNews.date}</p>
        </div>

        <div className="relative pl-5">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-base-600" />
          <div className="space-y-6">
            {EPISODES.map((ep, i) => (
              <div key={ep.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <span className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ${ep.dot} shadow-[0_0_10px_rgba(255,255,255,0.4)]`} />
                <div className={`panel panel-hover p-4 border ${ep.border}`}>
                  <p className={`text-[11px] font-mono uppercase tracking-widest ${ep.color}`}>{ep.number} · {ep.date}</p>
                  <h3 className="font-display font-semibold text-lg text-slate-50 mt-1">{ep.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{ep.summary}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ep.featured.map((id) => {
                      const c = wikiData.characters.find((ch) => ch.id === id)
                      if (!c) return null
                      return (
                        <span key={id} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-base-600/60 bg-base-800/70 text-slate-400">
                          {c.shortName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
