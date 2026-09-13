import { client } from './client.js'
import { normalizeCharacter, normalizeCharacters, serializeCharacter } from '../models/character.js'
import { ValidationError } from './errors.js'

function characterPath(id) {
  if (!Number.isSafeInteger(id) || id < 1) throw new ValidationError('У записи нет идентификатора базы данных.', { status: 422 })
  return `/characters/${id}`
}
export const charactersApi = {
  list: async options => normalizeCharacters(await client.request('/characters', options)),
  get: async (id, options) => normalizeCharacter(await client.request(characterPath(id), options)),
  create: async (form, options) => normalizeCharacter(await client.request('/characters', { ...options, method: 'POST', requireAuth: true, body: serializeCharacter(form) })),
  update: async (id, form, options) => normalizeCharacter(await client.request(characterPath(id), { ...options, method: 'PUT', requireAuth: true, body: serializeCharacter(form, { version: form.version }) })),
  remove: (id, version, options) => {
    if (!Number.isSafeInteger(version) || version < 1) throw new ValidationError('Обновите запись перед удалением.', { status: 422 })
    return client.request(characterPath(id), { ...options, method: 'DELETE', requireAuth: true, headers: { 'If-Match': `"${version}"` } })
  },
}
