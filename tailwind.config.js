/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#08090c',
          900: '#0d0f14',
          850: '#12151c',
          800: '#171b24',
          700: '#20242f',
          600: '#2b3040',
        },
        verton: {
          DEFAULT: '#39ff8a',
          dim: '#1c8a4c',
          glow: 'rgba(57, 255, 138, 0.55)',
        },
        qzero: {
          DEFAULT: '#2fd6ff',
          dim: '#1878a3',
          glow: 'rgba(47, 214, 255, 0.55)',
        },
        cortex: {
          DEFAULT: '#b453ff',
          dim: '#6a2b96',
          glow: 'rgba(180, 83, 255, 0.55)',
        },
        terton: {
          DEFAULT: '#9aa3ad',
          dim: '#4d545c',
          glow: 'rgba(154, 163, 173, 0.45)',
        },
        amber: {
          signal: '#ffb020',
        },
      },
      fontFamily: {
        display: ['"Rajdhani"', '"Orbitron"', 'sans-serif'],
        body: ['"Inter"', '"Manrope"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-verton': '0 0 8px rgba(57,255,138,0.7), 0 0 24px rgba(57,255,138,0.35)',
        'neon-qzero': '0 0 8px rgba(47,214,255,0.7), 0 0 24px rgba(47,214,255,0.35)',
        'neon-cortex': '0 0 8px rgba(180,83,255,0.7), 0 0 24px rgba(180,83,255,0.35)',
        'neon-terton': '0 0 6px rgba(154,163,173,0.5), 0 0 18px rgba(154,163,173,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'grid-fade': 'linear-gradient(to bottom, rgba(20,22,30,0) 0%, rgba(8,9,12,1) 100%)',
        'scanlines': 'repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1.6s step-start infinite',
        'flicker': 'flicker 3.2s linear infinite',
        'scan': 'scan 6s linear infinite',
        'fade-up': 'fadeUp 0.45s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: 1 },
          '20%, 22%, 24%, 55%': { opacity: 0.3 },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
