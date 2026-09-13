import { describe, expect, it } from 'vitest'
import wire from './fixtures/character.json'
import wiki from '../src/data/wiki_data.json'
import { normalizeCharacter, normalizeCharacters, normalizeFallbackCharacter, serializeCharacter, toCharacterForm, validateCharacter } from '../src/models/character.js'
import { ContractError, ValidationError } from '../src/api/errors.js'

describe('canonical Character boundary', () => {
  it('keeps database identity distinct from slug and maps only wire-specific nested fields', () => {
    const character = normalizeCharacter(wire)
    expect(character).toMatchObject({ id: 1, slug: 'verton', version: 1, relationships: [{ slug: 'qzero', description: 'Союзник' }] })
    expect(character.appearances[0]).not.toHaveProperty('id')
    expect(character).not.toHaveProperty('dbId')
    expect(character.biography).toBe(wire.biography)
  })

  it('all preserved fallback characters have canonical content but no database identity/version', () => {
    expect(wiki.characters.length).toBeGreaterThan(0)
    for (const legacy of wiki.characters) {
      const character = normalizeFallbackCharacter(legacy)
      expect(character).toMatchObject({ id: null, version: null, slug: legacy.slug, biography: legacy.biography })
      expect(validateCharacter(character)).toEqual({})
    }
  })

  it.each([null, 'oops', {}, [{ ...wire, id: '1' }], [{ ...wire, version: 0 }], [{ ...wire, biography: null }], [{ ...wire, abilities: null }], [{ ...wire, slug: '../admin' }], [wire, wire]])('rejects malformed API payload %#', value => {
    expect(() => normalizeCharacters(value)).toThrow(ContractError)
  })

  it('empty API data stays a valid empty catalog', () => expect(normalizeCharacters([])).toEqual([]))

  it('serializes editable content without accidental database IDs, versions or extra fields', () => {
    const form = { ...normalizeCharacter(wire), name: '  Мистер Вертон  ', extra: 'ignored' }
    const payload = serializeCharacter(form)
    expect(payload.name).toBe(wire.name)
    expect(payload.relationships).toEqual(wire.relationships)
    expect(payload.appearances).toEqual([{ episode: 'Эпизод 1', summary: 'Первое появление' }])
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('version')
    expect(payload).not.toHaveProperty('extra')
    expect(serializeCharacter(form, { version: 3 }).version).toBe(3)
    expect(() => serializeCharacter(form, { version: null })).toThrow(ValidationError)
  })

  it('validates required text, slug, enums and nested collection integrity together', () => {
    const form = { ...toCharacterForm(normalizeCharacter(wire)), slug: 'unsafe/slug', name: ' ', color: 'pink', abilities: [''], relationships: [{ slug: 'bad/slug', description: '' }], appearances: [{ episode: '', summary: 'text' }] }
    expect(validateCharacter(form)).toEqual(expect.objectContaining({ slug: expect.any(String), name: expect.any(String), color: expect.any(String), 'abilities.0': expect.any(String), 'relationships.0.slug': expect.any(String), 'relationships.0.description': expect.any(String), 'appearances.0.episode': expect.any(String) }))
    expect(() => serializeCharacter(form)).toThrow(ValidationError)
  })

  it('enforces limits and duplicate relationship targets', () => {
    const form = toCharacterForm(normalizeCharacter(wire))
    form.relationships.push({ ...form.relationships[0] })
    form.shortName = 'x'.repeat(81)
    form.abilities = Array.from({ length: 101 }, () => 'ability')
    expect(validateCharacter(form)).toMatchObject({ shortName: expect.any(String), abilities: expect.any(String), 'relationships.1.slug': expect.any(String) })
  })

  it('form copies do not mutate the shared server snapshot', () => {
    const character = normalizeCharacter(wire)
    const form = toCharacterForm(character)
    form.appearances[0].summary = 'draft'
    expect(character.appearances[0].summary).toBe(wire.appearances[0].summary)
    expect(form.race).toBe('')
  })
})
