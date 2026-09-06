import { useEffect, useMemo, useState } from 'react'
import { Users, Ghost } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import CharacterCard from '../components/CharacterCard'
import { useCharacters } from '../context/CharactersContext'
import { useTelegram } from '../hooks/useTelegram'
import { getTheme } from '../utils/theme'

/**
 * ЭТАЛОННЫЙ АВТОРСКИЙ ПОРЯДОК персонажей 1 Арки. Не сортировка по алфавиту
 * и не порядок из БД (Supabase/бэкенд отдаёт персонажей без гарантированного
 * порядка — отсюда был баг "гонки состояний", когда карточки на экране
 * скакали местами при каждой перезагрузке).
 *
 * Логика ниже всегда идёт ПО ЭТОМУ массиву и для каждого имени либо находит
 * реального персонажа в данных с бэкенда, либо рисует на его месте заглушку.
 * Порядок на экране благодаря этому всегда одинаковый, независимо от того,
 * в каком порядке пришёл ответ сети.
 */
const ARC_1_NAMES = [
  'Мистер Вертон', 'Кьюзеро', 'Кортекс', 'Тертон', 'Идея', 'Крейн', 'Мимико',
  'Грант', 'Безумный Вертон', 'Шизамен', 'Джэк', 'Робот Джэка', 'Кримзон',
  'Аэтр', 'Каедэ', 'Тео Накахара', 'Дайсролл', 'Щубинио', 'Самокко', 'Ривер',
  'Тейлор', 'Форвов', 'Холо', 'Эррор', 'Френсис', 'Шот', 'Веденси',
  'Скайтарион', 'Люмусон',
]

const ARC_TABS = [
  { id: 'arc-1', label: '1 Арка', heading: 'Персонажи из Первая Арка' },
  { id: 'arc-2', label: '2 Арка', heading: 'Персонажи из Вторая Арка' },
]

const SKELETON_COUNT = 12

/** Пульсирующая карточка-заглушка на время сетевого запроса. */
function SkeletonCard({ delay = 0 }) {
  return (
    <div
      className="panel p-3 flex flex-col items-center gap-2 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-base-800 border border-base-600/60" />
      <div className="w-full h-2.5 rounded-full bg-base-800" />
      <div className="w-2/3 h-2 rounded-full bg-base-800" />
    </div>
  )
}

/**
 * Заглушка для персонажа, который уже прописан в каноне (ARC_1_NAMES), но
 * ещё не заведён в базе. Рендерится вместо CharacterCard — не кликабельна
 * (переход по ней вёл бы на несуществующий профиль) и визуально притушена
 * (opacity-50 grayscale), чтобы явно читаться как "данные заполняются".
 */
function StubCharacterCard({ name, index = 0 }) {
  const theme = getTheme(undefined) // осознанно неизвестный цвет — призрачно-серая тема
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className="animate-fade-up opacity-50 grayscale"
      title="Данные заполняются"
    >
      <div className="panel p-3 flex flex-col items-center gap-2 text-center cursor-default select-none">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bgSoft}`}>
          <span className={`font-display font-bold text-lg ${theme.text}`}>{initial}</span>
        </div>
        <p className="text-[11px] font-medium text-slate-300 leading-tight line-clamp-2">{name}</p>
        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">Неизвестно</p>
      </div>
    </div>
  )
}

export default function CharacterList() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('arc-1')
  const [isLoading, setIsLoading] = useState(true)

  const { characters: charactersFromBackend, loading } = useCharacters()
  const { hapticImpact } = useTelegram()

  const activeArc = ARC_TABS.find((t) => t.id === activeTab) ?? ARC_TABS[0]

  /**
   * HARD-LOCKED SKELETON WINDOW
   *
   * The Context may immediately contain cached wiki_data.json characters.
   * We deliberately ignore whether the array is empty/non-empty here.
   *
   * Every time the backend character array changes, the component remains
   * in the skeleton state for a strict 700ms window. This gives the live
   * Supabase response time to overwrite the cached data before anything
   * is revealed.
   *
   * activeTab is also included so switching Arcs gets the same protected
   * transition.
   */
  useEffect(() => {
    setIsLoading(true)

    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 700)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [charactersFromBackend, activeTab])

  // Умная сортировка: идём строго по каноничному списку имён и подставляем
  // либо реального персонажа с бэкенда (по name/shortName), либо заглушку.
  const arc1Entries = useMemo(() => {
    return ARC_1_NAMES.map((name) => {
      const found = charactersFromBackend.find(
        (c) => c.name === name || c.shortName === name
      )

      return found
        ? { kind: 'real', key: found.id, name, character: found }
        : { kind: 'stub', key: `stub-${name}`, name, character: null }
    })
  }, [charactersFromBackend])

  const filteredArc1Entries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return arc1Entries

    return arc1Entries.filter((entry) => {
      if (entry.kind === 'real') {
        const c = entry.character

        return [c.name, c.shortName, c.role, c.status]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(q))
      }

      return entry.name.toLowerCase().includes(q)
    })
  }, [arc1Entries, query])

  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return

    hapticImpact('light')
    setActiveTab(tabId)
    setQuery('')
  }

  return (
    <Layout
      header={
        <TopBar
          title="Список персонажей"
          subtitle={`${charactersFromBackend.length} записи в реестре`}
          showBack
          accentClass="text-verton"
        />
      }
    >
      <div className="space-y-4">
        {/* Вкладки арок */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none border-b border-neutral-800 animate-fade-up">
          {ARC_TABS.map((tab) => {
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono uppercase tracking-wide transition-all duration-200 border ${
  isActive
      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
      : 'border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <h2 className="text-sm font-semibold text-slate-200 px-1 -mt-2 animate-fade-up">
          {activeArc.heading}
        </h2>

        {activeTab === 'arc-1' && (
          <div className="animate-fade-up">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Найти персонажа..."
            />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 40} />
            ))}
          </div>
        ) : activeTab === 'arc-2' ? (
          /* У 2 Арки пока нет персонажей в каноне — честное пустое состояние
             вместо выдуманных данных. */
          <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-base-800 border border-base-600 flex items-center justify-center mb-3">
              <Ghost size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Информация ещё не добавлена
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Эта арка пока в разработке
            </p>
          </div>
        ) : filteredArc1Entries.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {filteredArc1Entries.map((entry, i) =>
              entry.kind === 'real' ? (
                <CharacterCard
                  key={entry.key}
                  character={entry.character}
                  index={i}
                />
              ) : (
                <StubCharacterCard
                  key={entry.key}
                  name={entry.name}
                  index={i}
                />
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-base-800 border border-base-600 flex items-center justify-center mb-3">
              <Users size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Ничего не найдено
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Попробуйте другой запрос
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}