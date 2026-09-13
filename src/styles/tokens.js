/** Shared visual values: Tailwind, canvas and Telegram chrome use this palette. */
export const palette = {
  base: { 950: '#08090c', 900: '#0d0f14', 850: '#12151c', 800: '#171b24', 700: '#20242f', 600: '#2b3040' },
  verton: { DEFAULT: '#39ff8a', dim: '#1c8a4c', glow: 'rgba(57,255,138,0.55)' },
  qzero: { DEFAULT: '#2fd6ff', dim: '#1878a3', glow: 'rgba(47,214,255,0.55)' },
  cortex: { DEFAULT: '#b453ff', dim: '#6a2b96', glow: 'rgba(180,83,255,0.55)' },
  terton: { DEFAULT: '#9aa3ad', dim: '#4d545c', glow: 'rgba(154,163,173,0.45)' },
  amber: { signal: '#ffb020' },
  timeline: { bright: '#fff6dd', gold: '#fde9b8', middle: '#e8b95a', dim: '#7a5a24', red: '#ff5050', redDim: '#7a1010' },
}

export const tokens = {
  fontFamily: { display: ['Rajdhani', 'Orbitron', 'sans-serif'], body: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
  spacing: { page: '1rem', section: '1.25rem', control: '2.75rem' },
  radius: { card: '1rem', control: '0.75rem', dialog: '1.5rem' },
  zIndex: { header: '30', navigation: '40', dialog: '50' },
  transition: { fast: '150ms', normal: '250ms' },
  screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
}
