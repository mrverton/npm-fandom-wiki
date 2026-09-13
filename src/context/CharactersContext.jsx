import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import wiki from '../data/wiki_data.json'
import { normalizeFallbackCharacter } from '../models/character.js'
import { createCharactersStore } from '../data/charactersStore.js'
import { hasSeenApiInSession, markApiSeenInSession } from '../data/sessionPolicy.js'

const CharactersContext = createContext(null)
const fallback = wiki.characters.map(normalizeFallbackCharacter)
export function CharactersProvider({ children, store: suppliedStore }) {
  const [store] = useState(() => suppliedStore || createCharactersStore({ fallback, hasSeenApi: hasSeenApiInSession(), onApiSuccess: markApiSeenInSession }))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => { store.load(); return () => store.dispose() }, [store])
  const value = {
    ...state, series: wiki.series,
    loading: ['idle', 'loading'].includes(state.status), usingFallback: state.source === 'fallback',
    canMutate: state.source === 'api' && ['success', 'empty'].includes(state.status),
    reload: store.load, addCharacter: store.create, editCharacter: store.update, removeCharacter: store.remove,
  }
  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
}
export function useCharacters() {
  const value = useContext(CharactersContext)
  if (!value) throw new Error('useCharacters requires CharactersProvider')
  return value
}
