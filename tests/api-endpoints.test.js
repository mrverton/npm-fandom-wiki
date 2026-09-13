import { afterEach, describe, expect, it, vi } from 'vitest'
import { charactersApi } from '../src/api/characters.js'
import { authApi } from '../src/api/auth.js'
import { clearCredentials, setDevelopmentToken } from '../src/api/credentials.js'
import { ContractError, ValidationError } from '../src/api/errors.js'
import { normalizeCharacter, toCharacterForm } from '../src/models/character.js'
import wire from './fixtures/character.json'

const json = (value, status = 200) => new Response(JSON.stringify(value), { status })
afterEach(() => { clearCredentials(); delete window.Telegram })

describe('endpoint methods enforce the wire contract', () => {
  it('normalizes GET by database ID and rejects empty successful reads', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(json(wire)).mockResolvedValueOnce(new Response(''))
    vi.stubGlobal('fetch', fetchFn)
    expect(await charactersApi.get(1)).toMatchObject({ id: 1, slug: 'verton', relationships: [{ slug: 'qzero', description: 'Союзник' }] })
    expect(fetchFn.mock.calls[0][0]).toBe('/api/characters/1')
    await expect(charactersApi.list()).rejects.toBeInstanceOf(ContractError)
  })

  it.each([null, 0, -1, 'verton', '1', 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid database identity %s without transport', async id => {
    const fetchFn = vi.fn()
    vi.stubGlobal('fetch', fetchFn)
    await expect(charactersApi.get(id)).rejects.toBeInstanceOf(ValidationError)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rejects fallback writes, malformed form and missing optimistic version before transport', async () => {
    const fetchFn = vi.fn()
    vi.stubGlobal('fetch', fetchFn)
    setDevelopmentToken('test-only-dev-credential')
    const form = toCharacterForm(normalizeCharacter(wire))
    await expect(charactersApi.update(null, { ...form, version: 1 })).rejects.toBeInstanceOf(ValidationError)
    await expect(charactersApi.update(1, { ...form, version: null })).rejects.toBeInstanceOf(ValidationError)
    await expect(charactersApi.create({ ...form, name: '' })).rejects.toBeInstanceOf(ValidationError)
    expect(() => charactersApi.remove(1, null)).toThrow(ValidationError)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rejects truthy admin flags and unsafe or missing IDs in session responses', async () => {
    setDevelopmentToken('test-only-dev-credential')
    const fetchFn = vi.fn()
    vi.stubGlobal('fetch', fetchFn)
    for (const invalid of [null, {}, { userId: 1, isAdmin: 'true' }, { userId: '1', isAdmin: true }, { userId: 0, isAdmin: true }]) {
      fetchFn.mockResolvedValueOnce(json(invalid))
      await expect(authApi.session()).rejects.toBeInstanceOf(ContractError)
    }
    fetchFn.mockResolvedValueOnce(json({ userId: 1, isAdmin: false }))
    expect(await authApi.session()).toEqual({ userId: 1, isAdmin: false })
  })
})
