import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { Activity, GitBranch, Sparkles, Users2, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import { getTheme } from '../utils/theme'
import wikiData from '../data/wiki_data.json'

const TABS = [
  { id: 'bio', label: 'Биография' },
  { id: 'appearances', label: 'История появлений' },
]

export default function CharacterProfile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('bio')

  const character = wikiData.characters.find((c) => c.slug === slug)
  if (!character) return <Navigate to="/characters" replace />

  const theme = getTheme(character.color)
  const findCharacter = (id) => wikiData.characters.find((c) => c.id === id)

  return (
    <Layout
      header={
        <TopBar
          title={character.shortName}
          subtitle={theme.label}
          showBack
          accentClass={theme.text}
        />
      }
    >
      <div className="space-y-5">
        {/* Hero block */}
        <div className={`relative panel overflow-hidden p-5 animate-fade-up border ${theme.border}`}>
          <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full ${theme.bgSoft} blur-3xl pointer-events-none`} />
          <div className="relative flex items-center gap-4">
            <div className={`relative shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${theme.borderStrong} ${theme.bgSoft} ${theme.shadow}`}>
              <span className={`font-display font-bold text-3xl ${theme.text}`}>{character.avatarInitial}</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-xl text-slate-50 leading-tight">{character.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{character.occupation}</p>
              <div className="mt-2">
                <StatusBadge status={character.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Infobox */}
        <div className="panel p-4 space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Activity size={13} /> Инфобокс
          </h3>

          <InfoRow icon={Calendar} label="Текущая арка" accent={theme.text} value={character.arc} />
          <InfoRow icon={Users2} label="Роль" accent={theme.text} value={character.role} />

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2">
              <Sparkles size={13} /> Способности
            </div>
            <ul className="space-y-1.5">
              {character.abilities.map((ability, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300 leading-snug">
                  <span className={`shrink-0 mt-1.5 w-1 h-1 rounded-full ${theme.dot}`} />
                  {ability}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2">
              <GitBranch size={13} /> Отношения
            </div>
            <div className="space-y-2">
              {character.relationships.map((rel) => {
                const other = findCharacter(rel.id)
                if (!other) return null
                const otherTheme = getTheme(other.color)
                return (
                  <button
                    key={rel.id}
                    onClick={() => navigate(`/characters/${other.slug}`)}
                    className="w-full flex items-center gap-3 rounded-xl border border-base-600/50 bg-base-800/50 hover:bg-base-800 hover:border-base-600 p-2.5 transition-colors text-left"
                  >
                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${otherTheme.border} ${otherTheme.bgSoft}`}>
                      <span className={`font-display font-semibold text-sm ${otherTheme.text}`}>{other.avatarInitial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{other.name}</p>
                      <p className="text-xs text-slate-500 truncate">{rel.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex gap-1 p-1 rounded-xl bg-base-800/70 border border-base-600/50 mb-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all duration-200 ${
                  tab === t.id
                    ? `${theme.bgSoft} ${theme.text} shadow-sm`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="panel p-4 animate-fade-in">
            {tab === 'bio' ? (
              <div className="space-y-3">
                {character.biography.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed">{para}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {character.appearances.map((app, i) => (
                  <div key={i} className="relative pl-4">
                    <span className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                    {i < character.appearances.length - 1 && (
                      <span className="absolute left-[2.5px] top-4 bottom-[-14px] w-px bg-base-600" />
                    )}
                    <p className={`text-sm font-semibold ${theme.text}`}>{app.episode}</p>
                    <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{app.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className={`shrink-0 mt-0.5 ${accent}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
