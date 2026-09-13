import { Lock, Play } from 'lucide-react'
import { getEpisodeUrl, isArcAvailable } from '../data/editorial'

/** Both views use the same editorial availability, descriptions and media. */
export default function ArcContent({ arc }) {
  if (!isArcAvailable(arc)) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-control border border-base-600/60 bg-base-950/60 p-4">
        <Lock size={18} className="text-slate-500 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Временная ветка стабилизируется... Доступ заблокирован.
        </p>
      </div>
    )
  }
  const episodes = arc.episodes ?? []
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 leading-relaxed">
        {arc.desc || arc.description || 'Описание этой арки пока не добавлено.'}
      </p>
      {episodes.length === 0 ? (
        <p className="rounded-control border border-dashed border-base-600 p-4 text-center text-xs text-slate-500">
          Эпизоды этой арки ещё не добавлены
        </p>
      ) : (
        <ol className="space-y-2.5" aria-label="Эпизоды">
          {episodes.map((episode) => {
            const url = getEpisodeUrl(arc.id, episode.number)
            return (
              <li key={episode.number} className="rounded-control border border-base-600/60 bg-base-950/80 p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-qzero/70">Эпизод {episode.number}</p>
                <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{episode.title}</h3>
                {(episode.desc || episode.description) && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{episode.desc || episode.description}</p>
                )}
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="action-button mt-2 border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs">
                    <Play size={12} fill="currentColor" />Смотреть серию
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
