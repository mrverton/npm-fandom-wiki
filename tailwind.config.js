import { palette, tokens } from './src/styles/tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: tokens.screens,
    extend: {
      colors: palette,
      fontFamily: tokens.fontFamily,
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      zIndex: tokens.zIndex,
      transitionDuration: tokens.transition,
      boxShadow: {
        ...Object.fromEntries(['verton', 'qzero', 'cortex', 'terton'].map((key) => [`neon-${key}`, `0 0 8px ${palette[key].glow}, 0 0 24px ${palette[key].glow}`])),
        card: '0 4px 24px rgba(0,0,0,0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        blink: 'blink 1.6s step-start infinite',
        flicker: 'flicker 3.2s linear infinite',
        'fade-up': 'fadeUp 0.35s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        flicker: { '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: 1 }, '20%,22%,24%,55%': { opacity: 0.3 } },
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
