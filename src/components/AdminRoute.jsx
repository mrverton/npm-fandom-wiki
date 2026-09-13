import { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin.js'
import Layout from './Layout.jsx'
import { TopBar } from './TopBar.jsx'
import AsyncState from './common/AsyncState.jsx'
import Button from './common/Button.jsx'
import Field from './common/Field.jsx'
export default function AdminRoute({ children }) {
  const { status, isAdmin, error, development, login, verify } = useAdmin()
  const [token, setToken] = useState('')
  if (isAdmin) return children
  return <Layout header={<TopBar title="Доступ администратора" showBack accentClass="text-cortex" />}>
    {status === 'loading' ? <AsyncState loading title="Проверяем права доступа…" /> : <section className="panel p-5 space-y-4">
      <p className="text-sm text-slate-300">{status === 'authenticated' ? 'Эта учётная запись не имеет прав администратора.' : 'Для управления вики откройте Mini App из Telegram под учётной записью администратора.'}</p>
      {error && <p role="alert" className="text-sm text-rose-300">{error.message}</p>}
      {development && <form className="space-y-3" onSubmit={event => { event.preventDefault(); login(token); setToken('') }}>
        <Field name="dev-token" type="password" autoComplete="off" label="Токен локального администратора" value={token} onChange={event => setToken(event.target.value)} required hint="Для локальной разработки. Токен задаётся на сервере и не сохраняется в браузере." />
        <Button type="submit" disabled={!token.trim()}>Войти локально</Button>
      </form>}
      <Button variant="secondary" onClick={verify}>Проверить доступ снова</Button>
    </section>}
  </Layout>
}
