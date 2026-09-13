import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, GitBranch, Sparkles, Users2, Calendar, Fingerprint, Pencil } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import SpoilerText from '../components/SpoilerText'
import { getTheme } from '../utils/theme'
import { useCharacters } from '../context/CharactersContext'
import { useAdmin } from '../hooks/useAdmin'

export default function CharacterProfile() {
  const { slug } = useParams()
  const { characters, status } = useCharacters()
  const character = characters.find((entry) => entry.slug === slug)
  if (status === 'idle' || status === 'loading') return <Layout header={<TopBar title="Профиль персонажа" showBack />}><p role="status" className="empty-state">Загружаем персонажа…</p></Layout>
  if (!character) return <Layout header={<TopBar title="Профиль недоступен" showBack />}>
    <div className="empty-state space-y-4"><p>{status === 'fallback' || status === 'error' ? 'Не удалось найти профиль в доступных данных. Восстановите соединение и повторите загрузку.' : 'Такой персонаж не найден. Возможно, статья была удалена.'}</p><Link className="action-button" to="/characters">Открыть реестр</Link></div>
  </Layout>
  return <ProfileContent key={character.slug} character={character} characters={characters} />
}

function ProfileContent({ character, characters }) {
  const [tab, setTab] = useState('bio')
  const { isAdmin } = useAdmin()
  const { canMutate } = useCharacters()
  const theme = getTheme(character.color)
  return <Layout header={<TopBar title={character.shortName} subtitle={theme.label} showBack accentClass={theme.text}
    actions={isAdmin && canMutate ? <Link to={`/admin/edit/${character.slug}`} className="icon-button text-cortex" aria-label="Редактировать персонажа"><Pencil size={17} /></Link> : null} />}>
    <div className="space-y-5">
      <section className={`relative panel overflow-hidden p-5 ${theme.border}`}>
        <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full ${theme.bgSoft} blur-3xl pointer-events-none`} />
        <div className="relative flex items-center gap-4">
          <div className={`shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${theme.borderStrong} ${theme.bgSoft} ${theme.shadow}`}><span className={`font-display font-bold text-3xl ${theme.text}`}>{character.avatarInitial}</span></div>
          <div className="min-w-0"><h2 className="font-display font-bold text-xl text-slate-50 leading-tight">{character.name}</h2><p className="text-sm text-slate-400 mt-1">{character.occupation}</p><div className="mt-2"><StatusBadge status={character.status} /></div></div>
        </div>
      </section>
      <section className="panel p-4 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Activity size={13} />Инфобокс</h2>
        <InfoRow icon={Calendar} label="Текущая арка" accent={theme.text} value={character.arc} />
        <InfoRow icon={Users2} label="Роль" accent={theme.text} value={character.role} />
        <InfoRow icon={Fingerprint} label="Раса" accent={theme.text} value={character.race} />
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2"><Sparkles size={13} />Способности</h3>
          {character.abilities.length ? <ul className="space-y-1.5">{character.abilities.map((ability, index) => <li key={`${index}-${ability}`} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className={`shrink-0 mt-2 w-1 h-1 rounded-full ${theme.dot}`} /><SpoilerText text={ability} /></li>)}</ul> : <p className="text-sm text-slate-500">Способности ещё не описаны.</p>}
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2"><GitBranch size={13} />Отношения</h3>
          <div className="space-y-2">{character.relationships.length ? character.relationships.map((relation) => {
            const other = characters.find((entry) => entry.slug === relation.slug)
            if (!other) return <p key={relation.slug} className="rounded-xl border border-base-600/50 p-3 text-sm text-slate-400"><span className="font-medium">{relation.slug}</span> · {relation.description}<span className="block text-xs text-slate-500 mt-1">Связанный профиль сейчас недоступен.</span></p>
            const otherTheme = getTheme(other.color)
            return <Link key={relation.slug} to={`/characters/${other.slug}`} className="flex items-center gap-3 rounded-xl border border-base-600/50 bg-base-800/50 p-3 hover:border-base-600">
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${otherTheme.border} ${otherTheme.bgSoft}`}><span className={`font-display font-semibold ${otherTheme.text}`}>{other.avatarInitial}</span></div>
              <div className="min-w-0"><p className="text-sm font-medium text-slate-100">{other.name}</p><p className="text-xs text-slate-400">{relation.description}</p></div>
            </Link>
          }) : <p className="text-sm text-slate-500">Отношения ещё не описаны.</p>}</div>
        </div>
      </section>
      <section>
        <div className="flex gap-1 p-1 rounded-xl bg-base-800/70 border border-base-600/50 mb-3" aria-label="Раздел профиля">
          {[{ id: 'bio', label: 'Биография' }, { id: 'appearances', label: 'История появлений' }].map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`flex-1 min-h-control text-xs font-medium py-2 px-1 rounded-lg ${tab === item.id ? `${theme.bgSoft} ${theme.text}` : 'text-slate-400 hover:text-slate-300'}`}>{item.label}</button>)}
        </div>
        <div className="panel p-4">
          {tab === 'bio' ? <div className="space-y-3">{character.biography ? character.biography.split('\n\n').map((paragraph, index) => <p key={index} className="text-sm text-slate-300 leading-relaxed"><SpoilerText text={paragraph} /></p>) : <p className="text-sm text-slate-500">Биография ещё не опубликована.</p>}</div>
            : <div className="space-y-4">{character.appearances.length ? character.appearances.map((appearance, index) => <div key={`${index}-${appearance.episode}`} className="relative pl-4"><span className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full ${theme.dot}`} /><h3 className={`text-sm font-semibold ${theme.text}`}>{appearance.episode}</h3><p className="text-sm text-slate-400 mt-1 leading-relaxed"><SpoilerText text={appearance.summary} /></p></div>) : <p className="text-sm text-slate-500">Появления ещё не добавлены.</p>}</div>}
        </div>
      </section>
    </div>
  </Layout>
}

function InfoRow({ icon: Icon, label, value, accent }) {
  if (!value) return null
  return <div className="flex items-start gap-2.5"><Icon size={15} className={`shrink-0 mt-0.5 ${accent}`} /><div className="min-w-0"><p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{label}</p><p className="text-sm text-slate-200 mt-0.5">{value}</p></div></div>
}
