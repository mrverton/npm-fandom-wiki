import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import Providers from '../src/app/providers.jsx'
import { routes } from '../src/app/routes.jsx'
import { clearCredentials } from '../src/api/credentials.js'
import wire from './fixtures/character.json'

const json = (value, status = 200) => new Response(JSON.stringify(value), { status })
let activeRouter
beforeEach(() => {
  clearCredentials()
  delete window.Telegram
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { activeRouter?.dispose(); delete window.Telegram })

function mount(path = '/characters') {
  activeRouter = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<Providers><RouterProvider router={activeRouter} /></Providers>)
}
function asAdmin() { window.Telegram = { WebApp: { initData: 'signed-telegram-init-data' } } }

describe('critical public screens and route entry', () => {
  it('loads direct character route without Telegram and uses safe parent back navigation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([wire])))
    mount('/characters/verton')
    expect(await screen.findByRole('heading', { name: 'Мистер Вертон' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expect(await screen.findByRole('heading', { name: 'Список персонажей' })).toBeInTheDocument()
  })

  it('initial slow response shows only loading, then accepts an empty server catalog', async () => {
    let resolve
    vi.stubGlobal('fetch', vi.fn(() => new Promise(done => { resolve = done })))
    mount()
    expect(screen.getByRole('status', { name: 'Загружаем персонажей' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Вертон/ })).not.toBeInTheDocument()
    resolve(json([]))
    expect(await screen.findByText('В реестре пока нет опубликованных персонажей.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Вертон/ })).not.toBeInTheDocument()
  })

  it('unknown direct route renders a useful not-found screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([])))
    mount('/missing/deep-link')
    expect(await screen.findByText('Такой страницы нет')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть каталог персонажей' })).toHaveAttribute('href', '/characters')
  })

  it('browser reader cannot access mutation UI and forged unsafe user ID is insufficient', async () => {
    window.Telegram = { WebApp: { initDataUnsafe: { user: { id: 1510369013 } } } }
    const fetchFn = vi.fn().mockResolvedValue(json([wire]))
    vi.stubGlobal('fetch', fetchFn)
    mount('/admin')
    expect(await screen.findByText(/Для управления вики откройте Mini App/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Создать персонажа' })).not.toBeInTheDocument()
    expect(fetchFn.mock.calls.every(([url]) => !url.endsWith('/auth/session'))).toBe(true)
  })

  it('authenticated fallback is explicit and every mutation action is disabled', async () => {
    asAdmin()
    vi.stubGlobal('fetch', vi.fn(url => url.endsWith('/auth/session') ? Promise.resolve(json({ userId: 1, isAdmin: true })) : Promise.reject(new TypeError('Failed to fetch'))))
    mount('/admin')
    expect(await screen.findByRole('button', { name: 'Создать персонажа' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Редактировать Мистер Вертон' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Удалить Мистер Вертон' })).toBeDisabled()
    expect(screen.getByText('Архивная копия · только чтение')).toBeInTheDocument()
  })
})

describe('admin CRUD through the real API/model/store layers', () => {
  it('creates, edits and deletes without post-mutation reads or stale catalog flashes', async () => {
    asAdmin()
    let records = []
    const fetchFn = vi.fn(async (url, options = {}) => {
      if (url.endsWith('/auth/session')) return json({ userId: 1, isAdmin: true })
      if (options.method === 'POST') {
        const created = { ...JSON.parse(options.body), id: 2, version: 1 }
        records.push(created)
        return json(created, 201)
      }
      if (options.method === 'PUT') {
        records = [{ ...JSON.parse(options.body), id: 2, version: 2 }]
        return json(records[0])
      }
      if (options.method === 'DELETE') { records = []; return new Response(null, { status: 204 }) }
      return json(records)
    })
    vi.stubGlobal('fetch', fetchFn)
    const user = userEvent.setup()
    mount('/admin')
    await user.click(await screen.findByRole('button', { name: 'Создать персонажа' }))
    await user.type(await screen.findByLabelText('Slug'), 'new-hero')
    await user.type(screen.getByLabelText('Имя', { exact: true }), 'Новый герой')
    await user.type(screen.getByLabelText('Короткое имя'), 'Герой')
    await user.click(screen.getByRole('button', { name: 'Сохранить', exact: true }))
    expect(await screen.findByText('Изменения сохранены на сервере.')).toBeInTheDocument()
    expect(screen.getByLabelText('Slug')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'К списку' }))
    await user.click(await screen.findByRole('button', { name: 'Редактировать Новый герой' }))
    const name = await screen.findByLabelText('Имя', { exact: true })
    await user.clear(name)
    await user.type(name, 'Изменённый герой')
    await user.click(screen.getByRole('button', { name: 'Сохранить', exact: true }))
    expect(await screen.findByText('Изменения сохранены на сервере.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'К списку' }))
    await user.click(await screen.findByRole('button', { name: 'Удалить Изменённый герой' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Подтвердить удаление' }))
    expect(await screen.findByText('Персонаж «Изменённый герой» удалён.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Редактировать.*герой/ })).not.toBeInTheDocument()
    expect(fetchFn.mock.calls.filter(([url, options]) => url.endsWith('/characters') && options.method === 'GET')).toHaveLength(1)
    const writes = fetchFn.mock.calls.filter(([, options]) => ['POST', 'PUT', 'DELETE'].includes(options.method))
    expect(writes.map(([, options]) => options.method)).toEqual(['POST', 'PUT', 'DELETE'])
    expect(writes[1][1].body).toContain('"version":1')
    expect(writes[2][1].headers['If-Match']).toBe('"2"')
    expect(writes.every(([, options]) => options.headers['X-Telegram-Init-Data'] === 'signed-telegram-init-data')).toBe(true)
  })

  it('validates fields without a request and protects dirty form navigation/reset', async () => {
    asAdmin()
    const fetchFn = vi.fn(url => Promise.resolve(url.endsWith('/auth/session') ? json({ userId: 1, isAdmin: true }) : json([])))
    vi.stubGlobal('fetch', fetchFn)
    const user = userEvent.setup()
    mount('/admin/new')
    await user.click(await screen.findByRole('button', { name: 'Сохранить', exact: true }))
    expect(await screen.findByText('Проверьте отмеченные поля.')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    expect(fetchFn.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true)
    await user.type(screen.getByLabelText('Имя', { exact: true }), 'Черновик')
    await user.click(screen.getByRole('button', { name: 'К списку' }))
    const dialog = screen.getByRole('dialog', { name: 'Есть несохранённые изменения' })
    await user.click(within(dialog).getByRole('button', { name: 'Остаться' }))
    expect(screen.getByLabelText('Имя', { exact: true })).toHaveValue('Черновик')
    await user.click(screen.getByRole('button', { name: 'Сбросить форму' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Сбросить форму?' })).getByRole('button', { name: 'Сбросить', exact: true }))
    expect(screen.getByLabelText('Имя', { exact: true })).toHaveValue('')
  })

  it('keeps user text on a version conflict and displays the server explanation', async () => {
    asAdmin()
    vi.stubGlobal('fetch', vi.fn((url, options) => Promise.resolve(url.endsWith('/auth/session') ? json({ userId: 1, isAdmin: true }) : options.method === 'PUT' ? json({ error: { code: 'version_conflict', message: 'Кто-то уже обновил эту запись.' } }, 409) : json([wire]))))
    const user = userEvent.setup()
    mount('/admin/edit/verton')
    const input = await screen.findByLabelText('Имя', { exact: true })
    await user.clear(input)
    await user.type(input, 'Мой несохранённый текст')
    await user.click(screen.getByRole('button', { name: 'Сохранить', exact: true }))
    await waitFor(() => expect(screen.getAllByText('Кто-то уже обновил эту запись.').length).toBeGreaterThan(0))
    expect(input).toHaveValue('Мой несохранённый текст')
    expect(screen.getByRole('button', { name: 'Сохранить', exact: true })).toBeDisabled()
  })
})
