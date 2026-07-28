import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import wikiData from '../data/wiki_data.json'

const ARCS = [
  {
    id: 'arc-childhood',
    title: 'Арка «Детство»',
    episodes: 'Эпизод 1',
    color: 'text-verton',
    border: 'border-verton/40',
    bg: 'bg-verton/10',
    desc: 'Зарождение Ядра: Вертон строит систему в одиночку, находит и обучает Кьюзеро, а Тертон закладывает философию «чистого кода» — до того как его сигнал пропадает.',
    characters: ['verton', 'qzero', 'terton'],
  },
  {
    id: 'arc-bloodness',
    title: 'Арка «Bloodness Income»',
    episodes: 'Эпизод 2',
    color: 'text-cortex',
    border: 'border-cortex/40',
    bg: 'bg-cortex/10',
    desc: 'Война за Ядро: консорциум Кортекса поглощает систему и переманивает Кьюзеро, а Вертон уходит в подполье, чтобы защищать пользователей изнутри.',
    characters: ['verton', 'qzero', 'cortex'],
  },
]

export default function Arcs() {
  const navigate = useNavigate()

  return (
    <Layout
      header={<TopBar title="Сюжетные арки" subtitle="npm — story arcs" showBack accentClass="text-cortex" />}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 mb-1 animate-fade-up">
          <BookOpen size={14} className="text-slate-500" />
          <p className="text-xs text-slate-500">{ARCS.length} активные арки</p>
        </div>

        {ARCS.map((arc, i) => (
          <div
            key={arc.id}
            className={`panel panel-hover p-4 border ${arc.border} animate-fade-up`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <p className={`text-[11px] font-mono uppercase tracking-widest ${arc.color}`}>{arc.episodes}</p>
            <h3 className="font-display font-semibold text-lg text-slate-50 mt-1">{arc.title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{arc.desc}</p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex -space-x-2">
                {arc.characters.map((id) => {
                  const c = wikiData.characters.find((ch) => ch.id === id)
                  if (!c) return null
                  return (
                    <button
                      key={id}
                      onClick={() => navigate(`/characters/${c.slug}`)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-base-900 ${arc.bg} active:scale-90 transition-transform`}
                      title={c.name}
                    >
                      <span className={`font-display font-semibold text-[11px] ${arc.color}`}>{c.avatarInitial}</span>
                    </button>
                  )
                })}
              </div>
              <ArrowRight size={16} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
