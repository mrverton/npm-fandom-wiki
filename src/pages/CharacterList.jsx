import { useState } from 'react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import CharacterCard from '../components/CharacterCard'
import { useCharacters } from '../context/CharactersContext'
import { FUTURE_CHARACTERS, orderCharacters } from '../data/editorial'

export default function CharacterList() {
  const [query, setQuery] = useState('')
  const [activeArc, setActiveArc] = useState('all')
  const { characters, status, loading } = useCharacters()
  const arcs = [...new Set(characters.map((character) => character.arc).filter(Boolean))]
  const selectedArc = arcs.includes(activeArc) ? activeArc : 'all'
  const normalizedQuery = query.trim().toLocaleLowerCase('ru')
  const filtered = orderCharacters(characters).filter((character) =>
    (selectedArc === 'all' || character.arc === selectedArc) &&
    [character.name, character.shortName, character.role, character.status].some((value) => value.toLocaleLowerCase('ru').includes(normalizedQuery)))
  const future = FUTURE_CHARACTERS.filter((name) =>
    !characters.some((character) => character.name === name || character.shortName === name) &&
    name.toLocaleLowerCase('ru').includes(normalizedQuery))
  const initialLoading = status === 'idle' || status === 'loading'
  return (
    <Layout header={<TopBar title="Список персонажей" subtitle={initialLoading ? 'Загрузка реестра' : `Записей в реестре: ${characters.length}`} showBack accentClass="text-verton" />}>
      <div className="space-y-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Найти персонажа..." />
        {arcs.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Фильтр по арке">
          {['all', ...arcs].map((arc) => <button type="button" key={arc} aria-pressed={selectedArc === arc} onClick={() => setActiveArc(arc)}
            className={`shrink-0 px-3 py-2 min-h-control rounded-full text-xs border ${selectedArc === arc ? 'border-qzero/50 bg-qzero/10 text-qzero' : 'border-base-600 text-slate-400'}`}>
            {arc === 'all' ? 'Все арки' : arc}
          </button>)}
        </div>}
        {initialLoading ? <div role="status" aria-label="Загружаем персонажей" className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="panel h-28 animate-pulse" />)}
        </div> : filtered.length ? <div className="grid gap-3 sm:grid-cols-2" aria-busy={loading}>
          {filtered.map((character) => <CharacterCard key={character.slug} character={character} />)}
        </div> : <div className="empty-state">{query || selectedArc !== 'all' ? 'Ничего не найдено. Попробуйте другой запрос или арку.' : status === 'error' ? 'Реестр сейчас недоступен. Повторите загрузку выше.' : 'В реестре пока нет опубликованных персонажей.'}</div>}
        {!initialLoading && future.length > 0 && selectedArc === 'all' && <details className="panel p-4">
          <summary className="cursor-pointer text-sm text-slate-400">Ожидают статьи · {future.length}</summary>
          <p className="text-xs text-slate-500 mt-3">Редакционный список будущих статей первой арки. Это имена из канона, для которых ещё не опубликованы профили.</p>
          <ul className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-3">{future.map((name) => <li key={name}>{name}</li>)}</ul>
        </details>}
      </div>
    </Layout>
  )
}
