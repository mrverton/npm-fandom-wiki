import { useNavigate } from 'react-router-dom'
import { getTheme } from '../utils/theme'
import StatusBadge from './StatusBadge'

export default function CharacterCard({ character, index = 0 }) {
  const navigate = useNavigate()
  const theme = getTheme(character.color)

  return (
    <button
      onClick={() => navigate(`/characters/${character.slug}`)}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative w-full text-left panel panel-hover overflow-hidden animate-fade-up p-4 active:scale-[0.98] transition-transform"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-40 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative flex items-center gap-3.5">
        <div className={`relative shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bgSoft} ${theme.shadow}`}>
          <span className={`font-display font-bold text-xl ${theme.text}`}>{character.avatarInitial}</span>
          <div className={`absolute inset-0 rounded-xl border ${theme.border} animate-pulse-slow`} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-base text-slate-50 truncate">{character.name}</h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">{character.role}</p>
          <div className="mt-2">
            <StatusBadge status={character.status} size="sm" />
          </div>
        </div>
      </div>
    </button>
  )
}
