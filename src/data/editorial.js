/** Editorial metadata is read-only presentation, never a second character database. */
export const CHARACTER_ORDER = ['verton', 'qzero', 'cortex', 'terton']
export const FUTURE_CHARACTERS = [
  'Идея', 'Крейн', 'Мимико', 'Грант', 'Безумный Вертон', 'Шизамен', 'Джэк',
  'Робот Джэка', 'Кримзон', 'Аэтр', 'Каедэ', 'Тео Накахара', 'Дайсролл',
  'Щубинио', 'Самокко', 'Ривер', 'Тейлор', 'Форвов', 'Холо', 'Эррор',
  'Френсис', 'Шот', 'Веденси', 'Скайтарион', 'Люмусон',
]
const EPISODE_URLS = {
  'arc-1': {
    1: 'https://www.youtube.com/watch?v=F1QQtOQ9X84',
    2: 'https://www.youtube.com/watch?v=MRYtTh-WzJM',
  },
}
export const getEpisodeUrl = (arcId, number) => EPISODE_URLS[arcId]?.[number] ?? null
export const isArcAvailable = (arc) => arc?.isAvailable === true

export function orderCharacters(characters) {
  const rank = (slug) => {
    const index = CHARACTER_ORDER.indexOf(slug)
    return index < 0 ? CHARACTER_ORDER.length : index
  }
  return [...characters].sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name, 'ru') || a.slug.localeCompare(b.slug))
}
