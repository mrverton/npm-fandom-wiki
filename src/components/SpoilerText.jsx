import { useState } from 'react'

// Парсит строку на обычный текст и спойлеры, обёрнутые в ||двойные палки||
// Пример в wiki_data.json: "Обычный текст ||а тут спойлер про финал|| и снова обычный"
function parseSpoilers(text) {
  const parts = []
  const regex = /\|\|(.+?)\|\|/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'spoiler', content: match[1] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return parts
}

function SpoilerSpan({ content }) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return <span className="text-inherit">{content}</span>
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        setRevealed(true)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setRevealed(true)
        }
      }}
      title="Нажмите, чтобы показать спойлер"
      className="relative inline-flex items-center rounded-md cursor-pointer select-none align-middle mx-0.5 overflow-hidden"
      style={{ minWidth: '1.5em' }}
    >
      {/* Замазанный (blur) исходный текст — задаёт правильную ширину блока */}
      <span
        aria-hidden="true"
        className="invisible whitespace-pre"
      >
        {content}
      </span>
      {/* Затемняющий фон поверх */}
      <span className="absolute inset-0 rounded-md bg-base-600/90 backdrop-blur-sm border border-base-600" />
      {/* Лейбл "СПОЙЛЕР" */}
      <span className="absolute inset-0 flex items-center justify-center px-2 text-[10px] font-mono uppercase tracking-wider text-slate-300 whitespace-nowrap">
        Спойлер
      </span>
    </span>
  )
}

export default function SpoilerText({ text, as: Wrapper = 'span' }) {
  if (!text) return null
  const parts = parseSpoilers(text)

  return (
    <Wrapper>
      {parts.map((part, i) =>
        part.type === 'spoiler' ? (
          <SpoilerSpan key={i} content={part.content} />
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </Wrapper>
  )
}
