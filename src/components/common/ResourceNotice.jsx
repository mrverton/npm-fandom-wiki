import { useCharacters } from '../../context/CharactersContext.jsx'
export default function ResourceNotice() {
  const { status, error, source, reload } = useCharacters()
  if (['idle', 'loading', 'success', 'empty', 'mutating'].includes(status)) return null
  const refreshing = status === 'refreshing'
  return <div role={error ? 'alert' : 'status'} className="resource-notice panel border-amber-signal/40 p-3 text-sm mb-4">
    <p className="text-amber-signal">{refreshing ? 'Обновляем каталог…' : source === 'fallback' ? 'Архивная копия · только чтение' : 'Данные не удалось обновить'}</p>
    {error && <p className="mt-1 text-slate-300">{error.message}</p>}
    {!refreshing && <button type="button" className="mt-2 text-qzero underline underline-offset-4" onClick={reload}>Обновить данные</button>}
  </div>
}
