// Explicit class maps per character color — required because Tailwind's JIT
// scanner cannot resolve dynamically-constructed class strings like
// `text-${color}-500`. Keep every color variant enumerated here.

export const THEME = {
  verton: {
    text: 'text-verton',
    textDim: 'text-verton-dim',
    bg: 'bg-verton',
    bgSoft: 'bg-verton/10',
    border: 'border-verton/40',
    borderStrong: 'border-verton',
    ring: 'ring-verton/50',
    shadow: 'shadow-neon-verton',
    neonTextClass: 'neon-text-verton',
    dot: 'bg-verton',
    gradient: 'from-verton/20 via-verton/5 to-transparent',
    label: 'Верификация Ядра',
  },
  qzero: {
    text: 'text-qzero',
    textDim: 'text-qzero-dim',
    bg: 'bg-qzero',
    bgSoft: 'bg-qzero/10',
    border: 'border-qzero/40',
    borderStrong: 'border-qzero',
    ring: 'ring-qzero/50',
    shadow: 'shadow-neon-qzero',
    neonTextClass: 'neon-text-qzero',
    dot: 'bg-qzero',
    gradient: 'from-qzero/20 via-qzero/5 to-transparent',
    label: 'Автономный процесс',
  },
  cortex: {
    text: 'text-cortex',
    textDim: 'text-cortex-dim',
    bg: 'bg-cortex',
    bgSoft: 'bg-cortex/10',
    border: 'border-cortex/40',
    borderStrong: 'border-cortex',
    ring: 'ring-cortex/50',
    shadow: 'shadow-neon-cortex',
    neonTextClass: 'neon-text-cortex',
    dot: 'bg-cortex',
    gradient: 'from-cortex/20 via-cortex/5 to-transparent',
    label: 'Корпоративный агент',
  },
  terton: {
    text: 'text-terton',
    textDim: 'text-terton-dim',
    bg: 'bg-terton',
    bgSoft: 'bg-terton/10',
    border: 'border-terton/40',
    borderStrong: 'border-terton',
    ring: 'ring-terton/50',
    shadow: 'shadow-neon-terton',
    neonTextClass: 'neon-text-terton',
    dot: 'bg-terton',
    gradient: 'from-terton/20 via-terton/5 to-transparent',
    label: 'Сигнал утерян',
  },
}

export const getTheme = (colorKey) => THEME[colorKey] || THEME.terton

// Status → visual behavior (badge color + animation class)
export const STATUS_STYLES = {
  'Жив': { animation: 'animate-blink', colorKey: 'ok' },
  'Жива': { animation: 'animate-blink', colorKey: 'ok' },
  'Мертв': { animation: '', colorKey: 'dead' },
  'Неизвестно': { animation: 'animate-pulse-slow', colorKey: 'unknown' },
  'Связь потеряна': { animation: 'animate-flicker', colorKey: 'lost' },
}

export const STATUS_COLOR_CLASSES = {
  ok: { dot: 'bg-verton', text: 'text-verton', border: 'border-verton/40', bg: 'bg-verton/10' },
  dead: { dot: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  unknown: { dot: 'bg-qzero', text: 'text-qzero', border: 'border-qzero/40', bg: 'bg-qzero/10' },
  lost: { dot: 'bg-amber-signal', text: 'text-amber-signal', border: 'border-amber-signal/40', bg: 'bg-amber-signal/10' },
}

export const getStatusStyle = (status) => {
  const meta = STATUS_STYLES[status] || STATUS_STYLES['Неизвестно']
  const colors = STATUS_COLOR_CLASSES[meta.colorKey]
  return { ...meta, ...colors }
}
