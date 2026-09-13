import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Clock, BookOpen, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import NewsFeed from '../components/NewsFeed'
import AdminBadge from '../components/AdminBadge'
import { useCharacters } from '../context/CharactersContext'
import { useAdmin } from '../hooks/useAdmin'
import { getTheme } from '../utils/theme'
import { isArcAvailable } from '../data/editorial'

export default function Dashboard() {
  const { characters, series, status } = useCharacters()
  const { isAdmin } = useAdmin()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const arcs = series?.arcs ?? []
  const initialLoading = status === 'idle' || status === 'loading'
  const categories = [
    { to: '/characters', title: 'Персонажи', desc: initialLoading ? 'Загрузка реестра…' : `Записей в реестре: ${characters.length}`, icon: Users, color: 'verton' },
    { to: '/timeline', title: 'Хронология серий', desc: `Эпизодов в архиве: ${arcs.reduce((sum, arc) => sum + arc.episodes.length, 0)}`, icon: Clock, color: 'qzero' },
    { to: '/arcs', title: 'Сюжетные арки', desc: `Доступно арок: ${arcs.filter(isArcAvailable).length} из ${arcs.length}`, icon: BookOpen, color: 'cortex' },
  ]
  return (
    <Layout header={<TopBar title="НПМ Фандом Вики" subtitle="npm fandom wiki" actions={isAdmin ? <AdminBadge /> : null} />}>
      <div className="space-y-5">
        <form onSubmit={(event) => { event.preventDefault(); navigate(`/characters?q=${encodeURIComponent(query)}`) }} className="space-y-2">
          <SearchBar value={query} onChange={setQuery} placeholder="Найти персонажа..." />
          {query && <button type="submit" className="action-button w-full">Найти в реестре</button>}
        </form>
        <section aria-label="Разделы вики" className="grid gap-3">
          {categories.map(({ to, title, desc, icon: Icon, color }) => {
            const theme = getTheme(color)
            return <Link key={to} to={to} className="panel panel-hover flex items-center gap-4 p-4">
              <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bgSoft} ${theme.shadow}`}><Icon size={22} className={theme.text} /></div>
              <div><h2 className="font-display font-semibold text-slate-50">{title}</h2><p className="text-xs text-slate-400">{desc}</p></div>
            </Link>
          })}
        </section>
        <section className="space-y-2" aria-labelledby="news-heading">
          <div className="flex items-center gap-2 px-1"><Zap size={14} className="text-amber-signal" /><h2 id="news-heading" className="text-xs font-mono uppercase tracking-widest text-slate-400">Лента новостей</h2></div>
          <NewsFeed news={series?.latestNews} />
        </section>
      </div>
    </Layout>
  )
}
