import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createConfig } from './src/config/index.js'

export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  createConfig({ ...env, MODE: mode, PROD: command === 'build' })
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1', port: 5173, strictPort: true,
      proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    base: './',
  }
})
