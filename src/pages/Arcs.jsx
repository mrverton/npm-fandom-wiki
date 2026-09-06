import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, Play, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import { useCharacters } from '../context/CharactersContext'

/**
 * ИСТОЧНИК ИСТИНЫ: series.arcs (см. также Timeline.jsx — оба экрана
 * читают ОДНО и то же поле, чтобы данные не расходились).
 *
 * Ожидаемая форма (см. JSON-фрагмент, который идёт вместе с этим файлом):
 * series.arcs = [
 *   {
 *     id: 'arc-1',
 *     title: '1 Арка',
 *     desc: 'текст описания' | description: '...',
 *     status: 'Доступна' | 'В разработке',
 *     isAvailable: true | false,
 *     characters: ['verton', 'qzero', ...],   // для ряда аватарок внизу карточки
 *     episodes: [
 *       { number: 1, title: 'Детство', desc: '...' | description: '...' },
 *     ],
 *   },
 *   ...
 * ]
 *
 * Компонент полностью безопасен: если series.arcs отсутствует — просто
 * покажет пустое состояние без падения.
 */

function getYoutubeUrl(episodeNumber) {
  if (episodeNumber === 1) return 'https://www.youtube.com/watch?v=F1QQtOQ9X84'
  if (episodeNumber === 2) return 'https://www.youtube.com/watch?v=MRYtTh-WzJM'
  return null
}

export default function Arcs() {
  const navigate = useNavigate()
  const { characters, series, loading } = useCharacters()

  const globalArcs = series?.arcs || []
  const activeCount = globalArcs.filter((a) => a.isAvailable !== false && a.status !== 'В разработке').length

  if (loading && globalArcs.length === 0) {
    return (
        <Layout header={<TopBar title="Сюжетные арки" subtitle="npm — story arcs" showBack accentClass="text-cortex" />}>
          <div className="flex flex-col items-center justify-center text-center py-20 animate-fade-in">
            <Loader2 size={22} className="text-slate-600 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Загружаю арки...</p>
          </div>
        </Layout>
    )
  }

  return (
      <Layout
          header={<TopBar title="Сюжетные арки" subtitle="npm — story arcs" showBack accentClass="text-cortex" />}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 mb-1 animate-fade-up">
            <BookOpen size={14} className="text-slate-500" />
            <p className="text-xs text-slate-500">
              {activeCount} активные арки из {globalArcs.length}
            </p>
          </div>

          {globalArcs.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-base-800 border border-base-600 flex items-center justify-center mb-3">
                  <BookOpen size={22} className="text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Арки ещё не загружены</p>
                <p className="text-slate-600 text-xs mt-1">Данные появятся, как только будут добавлены в вики</p>
              </div>
          )}

          {globalArcs.map((arc, i) => {
            const isUnavailable = arc.isAvailable === false || arc.status === 'В разработке'
            const episodes = Array.isArray(arc.episodes) ? arc.episodes : []
            const arcCharacters = Array.isArray(arc.characters) ? arc.characters : []

            const cardStateClasses = isUnavailable
                ? 'border-neutral-800 bg-neutral-900/20 opacity-60'
                : 'border-cyan-500/30 bg-neutral-900/60'

            const badgeClasses = isUnavailable
                ? 'text-neutral-500 bg-neutral-800/50 border border-neutral-700/60'
                : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/40'

            return (
                <div
                    key={arc.id ?? i}
                    className={`panel panel-hover p-4 border animate-fade-up ${cardStateClasses}`}
                    style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-display font-semibold text-lg text-slate-50">
                      {arc.title}
                    </h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${badgeClasses}`}>
                  {arc.status || (isUnavailable ? 'В разработке' : 'Доступна')}
                </span>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {arc.desc || arc.description || 'Описание этой арки пока не добавлено.'}
                  </p>

                  {/* Вложенный список эпизодов */}
                  <div className="mt-3 space-y-2.5">
                    {episodes.length > 0 ? (
                        episodes.map((episode, epIdx) => {
                          const url = getYoutubeUrl(episode.number)
                          return (
                              <div
                                  key={epIdx}
                                  className="bg-neutral-950/80 border border-neutral-800/60 rounded-lg p-3.5 relative"
                              >
                                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
                                  Эпизод {episode.number}
                                </p>
                                <p className="text-sm font-semibold text-slate-100 mt-0.5">{episode.title}</p>
                                {(episode.desc || episode.description) && (
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                      {episode.desc || episode.description}
                                    </p>
                                )}
                                {url && (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/40 text-red-400 text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 mt-2 inline-flex"
                                    >
                                      <Play size={12} fill="currentColor" />
                                      Смотреть серию
                                    </a>
                                )}
                              </div>
                          )
                        })
                    ) : (
                        <div className="border border-dashed border-neutral-700/60 rounded-lg p-4 text-center">
                          <p className="text-xs text-neutral-500">Эпизоды этой арки ещё не добавлены</p>
                        </div>
                    )}
                  </div>

                  {/* Ряд аватарок персонажей арки + переход */}
                  {arcCharacters.length > 0 && (
                      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-base-600/30">
                        <div className="flex -space-x-2">
                          {arcCharacters.map((id) => {
                            const c = characters.find((ch) => ch.id === id)
                            if (!c) return null
                            return (
                                <button
                                    key={id}
                                    onClick={() => navigate(`/characters/${c.id}`)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-base-900 bg-cyan-500/10 active:scale-90 transition-transform"
                                    title={c.name}
                                >
                          <span className="font-display font-semibold text-[11px] text-cyan-400">
                            {c.avatarInitial}
                          </span>
                                </button>
                            )
                          })}
                        </div>
                        <ArrowRight size={16} className="text-slate-600" />
                      </div>
                  )}
                </div>
            )
          })}
        </div>
      </Layout>
  )
}
