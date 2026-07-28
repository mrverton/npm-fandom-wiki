import { getStatusStyle } from '../utils/theme'

export default function StatusBadge({ status, size = 'md' }) {
  const style = getStatusStyle(status)
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium font-mono uppercase tracking-wide ${style.border} ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span className={`inline-block rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${style.dot} ${style.animation}`} />
      {status}
    </span>
  )
}
