import { useMemo, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import CharacterCard from '../components/CharacterCard'
import { useCharacters } from '../context/CharactersContext'

export default function CharacterList() {
  const [query, setQuery] = useState('')
  const { characters, loading } = useCharacters()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) =>
      [c.name, c.role, c.status, c.arc].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    )
  }, [query, characters])

  return (
    <Layout
      header={
        <TopBar
          title="Список персонажей"
          subtitle={`${characters.length} записи в реестре`}
          showBack
          accentClass="text-verton"
        />
      }
    >
      <div className="space-y-4">
        <div className="animate-fade-up">
          <SearchBar value={query} onChange={setQuery} placeholder="Найти персонажа..." />
        </div>

        {loading && characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <Loader2 size={22} className="text-slate-600 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Загружаю персонажей...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((c, i) => (
              <CharacterCard key={c.id} character={c} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-base-800 border border-base-600 flex items-center justify-center mb-3">
              <Users size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Ничего не найдено</p>
            <p className="text-slate-600 text-xs mt-1">Попробуйте другой запрос</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
