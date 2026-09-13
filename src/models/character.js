import { ContractError, ValidationError } from '../api/errors.js'

export const CHARACTER_COLORS = ['verton', 'qzero', 'cortex', 'terton']
export const CHARACTER_STATUSES = ['Жив', 'Жива', 'Мертв', 'Неизвестно', 'Связь потеряна']
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const EMPTY_CHARACTER = {
  slug: '', name: '', shortName: '', color: 'qzero', status: 'Жив', arc: '', role: '', occupation: '',
  race: '', avatarInitial: '?', biography: '', abilities: [], relationships: [], appearances: [],
}
/** @typedef {{id:number|null,slug:string,version:number|null,name:string,shortName:string,color:string,status:string,arc:string,role:string,occupation:string,race:string|null,avatarInitial:string,biography:string,abilities:string[],relationships:{slug:string,description:string}[],appearances:{episode:string,summary:string}[]}} Character */

export function validateCharacter(value) {
  const errors = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { form: 'Ожидается объект персонажа.' }
  function text(field, item, max, required = false) {
    if (typeof item !== 'string') errors[field] = 'Ожидается текст.'
    else if (required && !item.trim()) errors[field] = 'Обязательное поле.'
    else if ([...item.trim()].length > max) errors[field] = `Максимум ${max} символов.`
  }
  text('slug', value.slug, 80, true)
  if (typeof value.slug === 'string' && !SLUG_PATTERN.test(value.slug.trim())) errors.slug = 'Используйте строчные латинские буквы, цифры и одиночные дефисы.'
  text('name', value.name, 160, true)
  text('shortName', value.shortName, 80, true)
  text('arc', value.arc, 120)
  for (const field of ['role', 'occupation']) text(field, value[field], 200)
  if (value.race !== null) text('race', value.race, 200)
  text('avatarInitial', value.avatarInitial, 4, true)
  text('biography', value.biography, 100000)
  if (!CHARACTER_COLORS.includes(value.color)) errors.color = 'Выберите цвет персонажа.'
  if (!CHARACTER_STATUSES.includes(value.status)) errors.status = 'Выберите статус персонажа.'
  for (const [field, limit] of [['abilities', 100], ['relationships', 100], ['appearances', 200]]) {
    if (!Array.isArray(value[field])) errors[field] = 'Ожидается список.'
    else if (value[field].length > limit) errors[field] = `Максимум ${limit} элементов.`
  }
  if (Array.isArray(value.abilities)) value.abilities.forEach((item, i) => text(`abilities.${i}`, item, 1000, true))
  const targets = new Set()
  if (Array.isArray(value.relationships)) value.relationships.forEach((item, i) => {
    text(`relationships.${i}.slug`, item?.slug, 80, true)
    if (!SLUG_PATTERN.test(item?.slug || '')) errors[`relationships.${i}.slug`] = 'Некорректный slug персонажа.'
    if (targets.has(item?.slug)) errors[`relationships.${i}.slug`] = 'Эта связь уже добавлена.'
    targets.add(item?.slug)
    text(`relationships.${i}.description`, item?.description, 5000, true)
  })
  if (Array.isArray(value.appearances)) value.appearances.forEach((item, i) => {
    text(`appearances.${i}.episode`, item?.episode, 200, true)
    text(`appearances.${i}.summary`, item?.summary, 10000)
  })
  return errors
}

export function serializeCharacter(form, { version } = {}) {
  const errors = validateCharacter(form)
  if (Object.keys(errors).length) throw new ValidationError('Проверьте заполнение полей.', {
    status: 422, fields: Object.entries(errors).map(([field, message]) => ({ field, message })),
  })
  const result = {}
  for (const field of ['slug', 'name', 'shortName', 'color', 'status', 'arc', 'role', 'occupation', 'avatarInitial', 'biography']) result[field] = form[field].trim()
  result.race = form.race?.trim() || null
  result.abilities = form.abilities.map(item => item.trim())
  result.relationships = form.relationships.map(item => ({ id: item.slug.trim(), description: item.description.trim() }))
  result.appearances = form.appearances.map(item => ({ episode: item.episode.trim(), summary: item.summary.trim() }))
  if (version !== undefined) {
    if (!Number.isSafeInteger(version) || version < 1) throw new ValidationError('Обновите запись перед сохранением.', { status: 422 })
    result.version = version
  }
  return result
}

/** Strict wire → canonical boundary. No silent repairs of an invalid live response. */
export function normalizeCharacter(wire) {
  if (!wire || !Number.isSafeInteger(wire.id) || wire.id < 1 || !Number.isSafeInteger(wire.version) || wire.version < 1) throw new ContractError('Сервер вернул персонажа без корректного идентификатора или версии.')
  if (typeof wire.slug !== 'string' || wire.slug !== wire.slug.trim()) throw new ContractError('Сервер вернул некорректный slug.')
  const character = {
    ...Object.fromEntries(Object.keys(EMPTY_CHARACTER).map(key => [key, wire[key]])),
    id: wire.id, version: wire.version,
    relationships: Array.isArray(wire.relationships) ? wire.relationships.map(item => ({ slug: item?.id, description: item?.description })) : wire.relationships,
    appearances: Array.isArray(wire.appearances) ? wire.appearances.map(item => ({ episode: item?.episode, summary: item?.summary })) : wire.appearances,
  }
  if (Object.keys(validateCharacter(character)).length) throw new ContractError('Формат персонажа не соответствует контракту API.')
  return character
}
export function normalizeCharacters(wire) {
  if (!Array.isArray(wire)) throw new ContractError('Сервер должен вернуть список персонажей.')
  const result = wire.map(normalizeCharacter)
  if (new Set(result.map(item => item.id)).size !== result.length || new Set(result.map(item => item.slug)).size !== result.length) throw new ContractError('Сервер вернул повторяющиеся идентификаторы персонажей.')
  return result
}
export function normalizeFallbackCharacter(legacy) {
  const character = normalizeCharacter({ ...EMPTY_CHARACTER, ...legacy, race: legacy.race ?? null, id: 1, version: 1 })
  return { ...character, id: null, version: null }
}
export function toCharacterForm(character) {
  if (!character) return structuredClone(EMPTY_CHARACTER)
  return structuredClone(Object.fromEntries(Object.keys(EMPTY_CHARACTER).map(key => [key, key === 'race' ? character[key] ?? '' : character[key]])))
}
