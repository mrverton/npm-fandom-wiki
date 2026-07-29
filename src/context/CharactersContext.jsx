import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import staticWikiData from '../data/wiki_data.json'

const CharactersContext = createContext(null)

// Приводим персонажа из API к тому же виду, что раньше был в статическом JSON:
// используем slug как строковый `id` (на него ссылаются relationships и роутинг),
// а настоящий числовой id из базы кладём в `dbId` — он нужен для PUT/DELETE запросов.
function mapApiCharacter(apiChar) {
  return {
    ...apiChar,
    id: apiChar.slug,
    dbId: apiChar.id,
  }
}

// Статические данные тоже приводим к единому виду (dbId будет отсутствовать —
// это нормально, значит персонаж ещё не существует в базе бэкенда).
function mapStaticCharacter(staticChar) {
  return { ...staticChar, dbId: null }
}

export function CharactersProvider({ children }) {
  const [characters, setCharacters] = useState(() =>
    staticWikiData.characters.map(mapStaticCharacter)
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getCharacters()
      setCharacters(data.map(mapApiCharacter))
      setUsingFallback(false)
    } catch (err) {
      // Бэкенд недоступен (например, ещё не задеплоен) — показываем
      // статические данные, чтобы приложение не осталось пустым.
      console.warn('Не удалось загрузить персонажей с API, использую локальные данные:', err)
      setCharacters(staticWikiData.characters.map(mapStaticCharacter))
      setUsingFallback(true)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addCharacter = useCallback(
    async (payload) => {
      const created = await api.createCharacter(payload)
      await load()
      return created
    },
    [load]
  )

  const editCharacter = useCallback(
    async (dbId, payload) => {
      const updated = await api.updateCharacter(dbId, payload)
      await load()
      return updated
    },
    [load]
  )

  const removeCharacter = useCallback(
    async (dbId) => {
      await api.deleteCharacter(dbId)
      await load()
    },
    [load]
  )

  const value = {
    characters,
    loading,
    error,
    usingFallback,
    reload: load,
    addCharacter,
    editCharacter,
    removeCharacter,
    series: staticWikiData.series,
  }

  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
}

export function useCharacters() {
  const ctx = useContext(CharactersContext)
  if (!ctx) {
    throw new Error('useCharacters должен использоваться внутри <CharactersProvider>')
  }
  return ctx
}
