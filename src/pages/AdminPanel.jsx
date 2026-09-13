import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { getTheme } from '../utils/theme.js'
import { useCharacters } from '../context/CharactersContext.jsx'
import { useAdmin } from '../hooks/useAdmin.js'
import Button from '../components/common/Button.jsx'
import Dialog from '../components/common/Dialog.jsx'
import AsyncState from '../components/common/AsyncState.jsx'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { characters, status, loading, canMutate, removeCharacter, reload } = useCharacters()
  const { verify, logout, development } = useAdmin()
  const [selected, setSelected] = useState(null)
  const [operation, setOperation] = useState({ status: 'idle', message: '' })
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const submitting = operation.status === 'submitting'
  async function confirmDelete() {
    if (!selected || submitting || !canMutate) return
    setOperation({ status: 'submitting', message: '' })
    try {
      await removeCharacter(selected.id, selected.version)
      if (mounted.current) { setOperation({ status: 'success', message: `Персонаж «${selected.name}» удалён.` }); setSelected(null) }
    } catch (error) {
      if (mounted.current) setOperation({ status: 'error', message: error.message })
      if ([401, 403].includes(error.status)) verify()
    }
  }
  return <Layout header={<TopBar title="Управление вики" subtitle="реестр персонажей" showBack accentClass="text-cortex" />}>
    <div className="flex flex-wrap gap-2 mb-4">
      <Button disabled={!canMutate} onClick={() => navigate('/admin/new')}><Plus size={16} />Создать персонажа</Button>
      <Button variant="secondary" disabled={['loading', 'refreshing', 'mutating'].includes(status)} onClick={reload}><RefreshCw size={16} />Обновить</Button>
      {development && <Button variant="secondary" disabled={submitting} onClick={logout}>Выйти</Button>}
    </div>
    {operation.message && <p role={operation.status === 'error' ? 'alert' : 'status'} className={`panel p-3 mb-4 text-sm ${operation.status === 'error' ? 'text-rose-300' : 'text-verton'}`}>{operation.message}</p>}
    {loading ? <AsyncState loading /> : characters.length === 0 ? <AsyncState title="В каталоге пока нет персонажей">Создайте первую запись, когда сервер доступен.</AsyncState> : <ul className="space-y-3">
      {characters.map(character => <li key={character.slug} className="panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0"><p className={`font-display text-xl ${getTheme(character.color).text}`}>{character.name}</p><p className="text-xs text-slate-500 font-mono break-all">{character.slug}</p></div>
        <Button variant="secondary" disabled={!canMutate} aria-label={`Редактировать ${character.name}`} onClick={() => navigate(`/admin/edit/${character.slug}`)}><Pencil size={16} /></Button>
        <Button variant="danger" disabled={!canMutate} aria-label={`Удалить ${character.name}`} onClick={() => { setSelected(character); setOperation({ status: 'idle', message: '' }) }}><Trash2 size={16} /></Button>
      </li>)}
    </ul>}
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title="Удалить персонажа?" closeDisabled={submitting}>
      <p className="text-sm text-slate-300 mb-4">«{selected?.name}» исчезнет из каталога. Это действие нельзя отменить.</p>
      {operation.status === 'error' && <p role="alert" className="text-rose-300 text-sm mb-3">{operation.message}</p>}
      <div className="flex gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setSelected(null)}>Отмена</Button><Button variant="danger" disabled={!canMutate || submitting} onClick={confirmDelete}>{submitting ? 'Удаляем…' : 'Подтвердить удаление'}</Button></div>
    </Dialog>
  </Layout>
}
