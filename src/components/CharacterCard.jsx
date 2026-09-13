import { Link } from 'react-router-dom'
import { getTheme } from '../utils/theme'
import StatusBadge from './StatusBadge'

export default function CharacterCard({ character }) {
  const theme = getTheme(character.color)
  const glitch = character.color === 'terton'
  return (
    <Link to={`/characters/${character.slug}`} className={`group relative block panel panel-hover overflow-hidden p-4 ${glitch ? 'glitch-card' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-40 group-hover:opacity-70 pointer-events-none`} />
      <div className={`relative flex items-center gap-3.5 ${glitch ? 'glitch-main' : ''}`}>
        <div className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bgSoft} ${theme.shadow}`}>
          <span className={`font-display font-bold text-xl ${theme.text}`}>{character.avatarInitial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-base text-slate-50">{character.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{character.role || 'Роль не указана'}</p>
          <div className="mt-2"><StatusBadge status={character.status} size="sm" /></div>
        </div>
      </div>
    </Link>
  )
}
