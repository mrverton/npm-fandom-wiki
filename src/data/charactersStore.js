import { charactersApi } from '../api/characters.js'
import { ApiError, ConflictError, NetworkError, canUseFallback, normalizeError } from '../api/errors.js'

/** Framework-independent resource state. Only acknowledged writes alter the snapshot. */
export function createCharactersStore({ api = charactersApi, fallback = [], hasSeenApi = false, onApiSuccess = () => {} } = {}) {
  let state = { status: 'idle', characters: [], source: null, error: null, mutation: null }
  const listeners = new Set()
  let generation = 0
  let controller = null
  let hasServerSnapshot = hasSeenApi
  let active = true
  const emit = patch => {
    if (!active) return
    state = { ...state, ...patch }
    listeners.forEach(listener => listener())
  }
  const settledStatus = characters => characters.length ? 'success' : 'empty'
  async function load() {
    if (state.status === 'mutating') return state
    active = true
    controller?.abort()
    controller = new AbortController()
    const current = ++generation
    emit({ status: state.source ? 'refreshing' : 'loading', error: null, mutation: null })
    try {
      const characters = await api.list({ signal: controller.signal })
      if (!active || current !== generation) return state
      hasServerSnapshot = true
      onApiSuccess()
      emit({ characters, source: 'api', status: settledStatus(characters), error: null })
    } catch (rawError) {
      if (!active || current !== generation || rawError?.name === 'AbortError') return state
      const error = normalizeError(rawError)
      if (!hasServerSnapshot && canUseFallback(error) && fallback.length) emit({ status: 'fallback', source: 'fallback', characters: fallback, error })
      else emit({ status: 'error', error })
    }
    return state
  }
  async function mutate(operation, execute, commit) {
    if (!active || state.source !== 'api' || !['success', 'empty'].includes(state.status)) throw new ConflictError('Сначала дождитесь загрузки актуальных данных с сервера.', { status: 409 })
    controller?.abort()
    controller = new AbortController()
    const current = ++generation
    emit({ status: 'mutating', mutation: operation, error: null })
    try {
      const result = await execute(controller.signal)
      if (active && current === generation) {
        const characters = commit(state.characters, result)
        emit({ characters, status: settledStatus(characters), source: 'api', mutation: null, error: null })
      }
      return result
    } catch (rawError) {
      const error = normalizeError(rawError)
      if (active && current === generation) {
        const uncertain = error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)
        emit({ status: 'error', mutation: null, error: uncertain ? new NetworkError('Не удалось подтвердить результат записи. Обновите каталог перед повторной попыткой: сервер мог сохранить изменения.', { cause: error }) : error })
      }
      throw error
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    load,
    create: payload => mutate('create', signal => api.create(payload, { signal }), (items, created) => [...items, created]),
    update: (id, payload) => mutate('update', signal => api.update(id, payload, { signal }), (items, updated) => items.map(item => item.id === id ? updated : item)),
    remove: (id, version) => mutate('delete', signal => api.remove(id, version, { signal }), items => items.filter(item => item.id !== id)),
    dispose() { active = false; generation += 1; controller?.abort() },
  }
}
