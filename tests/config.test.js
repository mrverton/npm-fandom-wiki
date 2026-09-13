import { describe, expect, it } from 'vitest'
import { createConfig } from '../src/config/index.js'

describe('environment configuration', () => {
  it('defaults to same-origin API and normalizes public HTTPS origins', () => {
    expect(createConfig({ MODE: 'production' })).toMatchObject({ apiBaseUrl: '/api', development: false })
    expect(createConfig({ PROD: true, VITE_API_BASE_URL: 'https://api.example.com/' }).apiBaseUrl).toBe('https://api.example.com/api')
    expect(createConfig({ VITE_API_BASE_URL: 'https://api.example.com/api/' }).apiBaseUrl).toBe('https://api.example.com/api')
  })
  it.each(['http://api.example.com', 'https://localhost', 'http://127.0.0.1:8000', 'https://[::1]', 'https://user:secret@api.example.com', 'https://api.example.com/other', 'https://api.example.com?secret=x', 'not-a-url'])('refuses unsafe production API address %s', url => {
    expect(() => createConfig({ PROD: true, VITE_API_BASE_URL: url })).toThrow()
  })
  it('supports explicit local development and validates timeout bounds', () => {
    expect(createConfig({ MODE: 'development', VITE_API_BASE_URL: 'http://127.0.0.1:8000' })).toMatchObject({ development: true, apiBaseUrl: 'http://127.0.0.1:8000/api' })
    expect(() => createConfig({ VITE_API_TIMEOUT_MS: '0' })).toThrow()
    expect(() => createConfig({ VITE_API_TIMEOUT_MS: 'abc' })).toThrow()
    expect(() => createConfig({ VITE_API_TIMEOUT_MS: '120001' })).toThrow()
  })
})
