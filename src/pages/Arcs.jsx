import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import ArcContent from '../components/ArcContent'
import { useCharacters } from '../context/CharactersContext'
import { isArcAvailable } from '../data/editorial'
import { getTheme } from '../utils/theme'

export default function Arcs() {
  const { characters, series } = useCharacters()
  const arcs = series?.arcs ?? []
  const availableCount = arcs.filter(isArcAvailable).length

  return (
    <Layout header={<TopBar title="Сюжетные арки" showBack accentClass="text-qzero" />}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 mb-1">
          <BookOpen size={14} className="text-slate-500" />
          <p className="text-xs text-slate-500">Доступно арок: {availableCount} из {arcs.length}</p>
        </div>
        {arcs.length === 0 && <div className="empty-state">Арки ещё не добавлены в вики.</div>}
        {arcs.map((arc) => {
          const available = isArcAvailable(arc)
          const cast = (arc.characters ?? []).flatMap((slug) => {
            const character = characters.find((entry) => entry.slug === slug)
            return character ? [character] : []
          })
          return (
            <section key={arc.id} className={`panel p-4 ${available ? 'border-qzero/30' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="font-display font-semibold text-lg text-slate-50">{arc.title}</h2>
                <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-wider shrink-0 ${available ? 'text-qzero bg-qzero/10 border-qzero/40' : 'text-slate-400 bg-base-800 border-base-600'}`}>
                  {arc.status || (available ? 'Доступна' : 'В разработке')}
                </span>
              </div>
              <ArcContent arc={arc} />
              {available && cast.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3.5 pt-3 border-t border-base-600/40" aria-label="Персонажи арки">
                  {cast.map((character) => {
                    const theme = getTheme(character.color)
                    return (
                      <Link key={character.slug} to={`/characters/${character.slug}`} aria-label={character.name}
                        className={`flex min-w-control min-h-control items-center justify-center rounded-full border ${theme.border} ${theme.bgSoft} ${theme.text}`}
                        title={character.name}>
                        <span className="font-display font-semibold text-sm">{character.avatarInitial}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </Layout>
  )
}
