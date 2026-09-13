import { describe, expect, it, vi } from 'vitest'
import { createCharactersStore } from '../src/data/charactersStore.js'
import { AuthenticationError, ConflictError, ContractError, NetworkError, ServerError } from '../src/api/errors.js'
import { normalizeCharacter } from '../src/models/character.js'
import wire from './fixtures/character.json'

const character = normalizeCharacter(wire)
const fallback = [{ ...character, id: null, version: null }]
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
function setup(overrides = {}, options = {}) {
  const api = { list: vi.fn().mockResolvedValue([character]), create: vi.fn(), update: vi.fn(), remove: vi.fn(), ...overrides }
  return { api, store: createCharactersStore({ api, fallback, ...options }) }
}

describe('resource state and authoritative data', () => {
  it('initial loading never exposes static or cached characters', async () => {
    const read = deferred()
    const { store } = setup({ list: () => read.promise })
    expect(store.getSnapshot()).toMatchObject({ status: 'idle', characters: [], source: null })
    const done = store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'loading', characters: [], source: null })
    read.resolve([character])
    await done
    expect(store.getSnapshot()).toMatchObject({ status: 'success', characters: [character], source: 'api' })
  })

  it('empty server catalog is authoritative, persists the provenance marker and never seeds fallback', async () => {
    const onApiSuccess = vi.fn()
    const { api, store } = setup({ list: vi.fn().mockResolvedValue([]) }, { onApiSuccess })
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'empty', characters: [], source: 'api' })
    expect(onApiSuccess).toHaveBeenCalledTimes(1)
    api.list.mockRejectedValue(new NetworkError('offline'))
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error', characters: [], source: 'api' })
  })

  it.each([new NetworkError('offline'), new ServerError('unavailable', { status: 503 })])('uses explicit read-only fallback only on initial availability failure', async error => {
    const { api, store } = setup({ list: vi.fn().mockRejectedValue(error) })
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'fallback', source: 'fallback', characters: fallback })
    await expect(store.create({})).rejects.toBeInstanceOf(ConflictError)
    await expect(store.update(1, {})).rejects.toBeInstanceOf(ConflictError)
    await expect(store.remove(1, 1)).rejects.toBeInstanceOf(ConflictError)
    expect(api.create).not.toHaveBeenCalled()
    expect(api.update).not.toHaveBeenCalled()
    expect(api.remove).not.toHaveBeenCalled()
  })

  it.each([new AuthenticationError('invalid session'), new ContractError('malformed response')])('does not disguise auth/contract errors with fallback', async error => {
    const { store } = setup({ list: vi.fn().mockRejectedValue(error) })
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error', characters: [], source: null, error })
  })

  it('does not resurrect fallback after a real page refresh in a previously connected session', async () => {
    const { store } = setup({ list: vi.fn().mockRejectedValue(new NetworkError('offline')) }, { hasSeenApi: true })
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error', characters: [], source: null })
  })

  it('retains server snapshot after failed reload and permits mutations only after successful retry', async () => {
    const { api, store } = setup()
    await store.load()
    api.list.mockRejectedValueOnce(new NetworkError('offline'))
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error', source: 'api', characters: [character] })
    await expect(store.remove(1, 1)).rejects.toBeInstanceOf(ConflictError)
    await store.load()
    expect(store.getSnapshot().status).toBe('success')
  })

  it('latest request wins even when old transport ignores abort', async () => {
    const first = deferred(), second = deferred(), onApiSuccess = vi.fn()
    const { api, store } = setup({ list: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) }, { onApiSuccess })
    const oldRequest = store.load(), newRequest = store.load()
    expect(api.list.mock.calls[0][0].signal.aborted).toBe(true)
    second.resolve([])
    await newRequest
    first.resolve([character])
    await oldRequest
    expect(store.getSnapshot()).toMatchObject({ status: 'empty', characters: [] })
    expect(onApiSuccess).toHaveBeenCalledTimes(1)
  })

  it('disposing aborts requests and prevents notifications or writes after unmount', async () => {
    const read = deferred()
    const { api, store } = setup({ list: vi.fn().mockReturnValue(read.promise) })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    const pending = store.load()
    store.dispose()
    expect(api.list.mock.calls[0][0].signal.aborted).toBe(true)
    const calls = listener.mock.calls.length
    read.resolve([character])
    await pending
    expect(listener).toHaveBeenCalledTimes(calls)
    expect(store.getSnapshot().characters).toEqual([])
    await expect(store.create({})).rejects.toBeInstanceOf(ConflictError)
    unsubscribe()
  })
})

describe('acknowledged CRUD state', () => {
  it('reflects create/update/delete atomically with no follow-up GET and no deleted-record resurrection', async () => {
    const second = { ...character, id: 2, slug: 'new-hero', name: 'Новый герой' }
    const updated = { ...second, version: 2, name: 'Обновлённый герой' }
    const { api, store } = setup({ create: vi.fn().mockResolvedValue(second), update: vi.fn().mockResolvedValue(updated), remove: vi.fn().mockResolvedValue(null) })
    await store.load()
    await store.create({ name: 'Новый герой' })
    expect(store.getSnapshot().characters).toEqual([character, second])
    await store.update(2, { name: updated.name, version: 1 })
    expect(store.getSnapshot().characters).toEqual([character, updated])
    await store.remove(2, 2)
    expect(store.getSnapshot().characters).toEqual([character])
    expect(api.list).toHaveBeenCalledTimes(1)
    expect(api.remove).toHaveBeenCalledWith(2, 2, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    api.list.mockRejectedValue(new NetworkError('offline'))
    await store.load()
    expect(store.getSnapshot().characters).toEqual([character])
  })

  it('serializes mutations and prevents reload from overwriting a pending write', async () => {
    const write = deferred()
    const { api, store } = setup({ remove: vi.fn().mockReturnValue(write.promise) })
    await store.load()
    const pending = store.remove(1, 1)
    expect(store.getSnapshot()).toMatchObject({ status: 'mutating', mutation: 'delete', characters: [character] })
    await expect(store.remove(1, 1)).rejects.toBeInstanceOf(ConflictError)
    await store.load()
    expect(api.list).toHaveBeenCalledTimes(1)
    write.resolve(null)
    await pending
    expect(store.getSnapshot()).toMatchObject({ status: 'empty', characters: [], mutation: null })
  })

  it('preserves records and demands reconciliation after ambiguous network write failure', async () => {
    const { api, store } = setup({ remove: vi.fn().mockRejectedValue(new NetworkError('offline')) })
    await store.load()
    await expect(store.remove(1, 1)).rejects.toBeInstanceOf(NetworkError)
    expect(store.getSnapshot()).toMatchObject({ status: 'error', characters: [character], source: 'api', mutation: null })
    expect(store.getSnapshot().error.message).toContain('сервер мог сохранить')
    await expect(store.remove(1, 1)).rejects.toBeInstanceOf(ConflictError)
    expect(api.remove).toHaveBeenCalledTimes(1)
  })

  it('retains authoritative records and meaningful server conflicts', async () => {
    const conflict = new ConflictError('Другая версия', { status: 409 })
    const { store } = setup({ update: vi.fn().mockRejectedValue(conflict) })
    await store.load()
    await expect(store.update(1, {})).rejects.toBe(conflict)
    expect(store.getSnapshot()).toMatchObject({ error: conflict, characters: [character] })
  })
})
