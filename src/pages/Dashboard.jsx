import { useNavigate } from 'react-router-dom'
import { Users, Clock, BookOpen, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import NewsFeed from '../components/NewsFeed'
import AdminBadge from '../components/AdminBadge'
import { useCharacters } from '../context/CharactersContext'
import { useAdmin } from '../hooks/useAdmin'

const ACCENT_CLASSES = {
  verton: { border: 'border-verton/40', bg: 'bg-verton/10', text: 'text-verton', shadow: 'shadow-neon-verton' },
  qzero: { border: 'border-qzero/40', bg: 'bg-qzero/10', text: 'text-qzero', shadow: 'shadow-neon-qzero' },
  cortex: { border: 'border-cortex/40', bg: 'bg-cortex/10', text: 'text-cortex', shadow: 'shadow-neon-cortex' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { characters, series } = useCharacters()
  const { isAdmin } = useAdmin()

  const categories = [
    {
      to: '/characters',
      title: 'Персонажи',
      desc: `${characters.length} записи в базе`,
      icon: Users,
      accent: 'verton',
    },
    {
      to: '/timeline',
      title: 'Хронология серий',
      desc: '2 эпизода в архиве',
      icon: Clock,
      accent: 'qzero',
    },
    {
      to: '/arcs',
      title: 'Сюжетные арки',
      desc: '1 и 2 Глава',
      icon: BookOpen,
      accent: 'cortex',
    },
  ]

  return (
    <Layout
      header={
        <TopBar
          title="НПМ Фандом Вики"
          subtitle="npm fandom wiki // v1.0"
          actions={isAdmin ? <AdminBadge /> : null}
        />
      }
    >
      <div className="space-y-5">
        <div
          className="animate-fade-up"
          onClick={() => navigate('/characters')}
        >
          <SearchBar value="" onChange={() => navigate('/characters')} />
        </div>

        <section className="grid grid-cols-1 gap-3">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            const a = ACCENT_CLASSES[cat.accent]
            return (
              <button
                key={cat.to}
                onClick={() => navigate(cat.to)}
                style={{ animationDelay: `${i * 70}ms` }}
                className="animate-fade-up panel panel-hover flex items-center gap-4 p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${a.border} ${a.bg} ${a.shadow}`}>
                  <Icon size={22} className={a.text} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-slate-50">{cat.title}</h3>
                  <p className="text-xs text-slate-500">{cat.desc}</p>
                </div>
              </button>
            )
          })}
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Zap size={14} className="text-amber-signal" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">Лента новостей</h2>
          </div>
          <NewsFeed news={series.latestNews} />
        </section>
      </div>
    </Layout>
  )
}
