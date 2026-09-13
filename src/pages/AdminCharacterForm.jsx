import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { useCharacters } from '../context/CharactersContext.jsx'
import { CHARACTER_COLORS, CHARACTER_STATUSES, toCharacterForm, validateCharacter } from '../models/character.js'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges.js'
import AsyncState from '../components/common/AsyncState.jsx'
import Button from '../components/common/Button.jsx'
import Field from '../components/common/Field.jsx'
import Dialog from '../components/common/Dialog.jsx'
import CharacterCollections from '../components/admin/CharacterCollections.jsx'

export default function AdminCharacterForm() {
  const { slug } = useParams()
  return <EditorLoader key={slug || 'new'} slug={slug} />
}

function EditorLoader({ slug }) {
  const { characters, loading, source } = useCharacters()
  const [session, setSession] = useState(null)
  const existing = characters.find(character => character.slug === slug)
  // Capture exactly one server snapshot for this route. Subsequent reloads never reset a draft.
  useEffect(() => {
    if (!session && source === 'api' && (!slug || existing)) setSession({ initial: existing || null })
  }, [session, source, slug, existing])
  return <Layout header={<TopBar title={slug ? 'Редактировать персонажа' : 'Новый персонаж'} subtitle="редактор вики" showBack accentClass="text-cortex" />}>
    {session ? <CharacterEditor initial={session.initial} /> : loading ? <AsyncState loading /> : <AsyncState title={source === 'api' ? 'Персонаж не найден' : 'Редактор недоступен'}>{source === 'api' ? 'Проверьте ссылку или откройте каталог.' : 'Для редактирования нужен актуальный ответ сервера.'}</AsyncState>}
  </Layout>
}

export function CharacterEditor({ initial }) {
  const navigate = useNavigate()
  const { characters, canMutate, addCharacter, editCharacter } = useCharacters()
  const [record, setRecord] = useState(initial)
  const [baseline, setBaseline] = useState(() => toCharacterForm(initial))
  const [form, setForm] = useState(() => toCharacterForm(initial))
  const [operation, setOperation] = useState({ status: 'idle', message: '' })
  const [errors, setErrors] = useState({})
  const [resetOpen, setResetOpen] = useState(false)
  const mounted = useRef(true)
  const submittingRef = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline)
  const submitting = operation.status === 'submitting'
  const blocker = useUnsavedChanges(dirty || submitting)
  const latest = record ? characters.find(character => character.id === record.id) : null
  const stale = record && (!latest || latest.version !== record.version)
  const update = (field, value) => {
    setForm(previous => ({ ...previous, [field]: value }))
    setOperation({ status: 'idle', message: '' })
  }
  const field = (name, label, props = {}) => <Field name={name} label={label} value={form[name]} onChange={event => update(name, event.target.value)} error={errors[name]} {...props} />

  async function submit(event) {
    event.preventDefault()
    if (submittingRef.current || !canMutate) return
    const validation = validateCharacter(form)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setOperation({ status: 'error', message: 'Проверьте отмеченные поля.' })
      return
    }
    submittingRef.current = true
    setOperation({ status: 'submitting', message: '' })
    try {
      const saved = record ? await editCharacter(record.id, { ...form, version: record.version }) : await addCharacter(form)
      if (!mounted.current) return
      const savedForm = toCharacterForm(saved)
      setRecord(saved)
      setForm(savedForm)
      setBaseline(savedForm)
      setOperation({ status: 'success', message: 'Изменения сохранены на сервере.' })
    } catch (error) {
      if (!mounted.current) return
      setOperation({ status: 'error', message: error.message })
      setErrors(Object.fromEntries((error.fields || []).map(({ field: key, message }) => [String(key).replace(/^(body\.)/, '').replace(/^(relationships\.\d+)\.id$/, '$1.slug'), message])))
    } finally { submittingRef.current = false }
  }

  function reset() {
    const current = latest || record
    const next = toCharacterForm(current)
    setRecord(current)
    setForm(next)
    setBaseline(next)
    setErrors({})
    setOperation({ status: 'idle', message: '' })
    setResetOpen(false)
  }

  return <>
    <form onSubmit={submit} noValidate className="space-y-4 pb-6">
      <div className="flex justify-between gap-3 text-xs text-slate-400"><span>{dirty ? 'Есть несохранённые изменения' : 'Нет несохранённых изменений'}</span>{record && <span>Версия {record.version}</span>}</div>
      {stale && <div role="alert" className="panel border-amber-signal/40 p-3 text-sm text-amber-signal">{latest ? 'На сервере есть другая версия. Ваш текст сохранён в форме. Загрузите серверную версию перед редактированием.' : 'Эта запись удалена на сервере. Текст остаётся в форме для копирования.'}</div>}
      {operation.message && <div role={operation.status === 'error' ? 'alert' : 'status'} className={`panel p-3 text-sm ${operation.status === 'error' ? 'text-rose-300' : 'text-verton'}`}>{operation.message}</div>}
      <fieldset disabled={submitting} className="space-y-4">
        <section className="panel p-4 space-y-4"><h2 className="font-display text-xl text-cortex">Карточка персонажа</h2>
          {field('slug', 'Slug', { disabled: Boolean(record), required: true, maxLength: 80, hint: 'Постоянная часть ссылки. После создания не меняется.' })}
          <div className="grid sm:grid-cols-2 gap-4">{field('name', 'Имя', { required: true, maxLength: 160 })}{field('shortName', 'Короткое имя', { required: true, maxLength: 80 })}</div>
          <div className="grid grid-cols-2 gap-4">
            {field('color', 'Цвет', { as: 'select', children: CHARACTER_COLORS.map(color => <option key={color} value={color}>{({ verton: 'Зелёный', qzero: 'Синий', cortex: 'Фиолетовый', terton: 'Серый' })[color]}</option>) })}
            {field('status', 'Статус', { as: 'select', children: CHARACTER_STATUSES.map(status => <option key={status}>{status}</option>) })}
          </div>
          {field('arc', 'Арка', { maxLength: 120, placeholder: '1 Арка' })}
          {field('role', 'Роль', { maxLength: 200 })}
          {field('occupation', 'Занятие', { maxLength: 200 })}
          {field('race', 'Раса', { maxLength: 200 })}
          {field('avatarInitial', 'Инициалы', { required: true, maxLength: 4 })}
          {field('biography', 'Биография', { as: 'textarea', rows: 8, maxLength: 100000, hint: 'Спойлеры отмечаются двойными чертами: ||скрытый текст||.' })}
        </section>
        <CharacterCollections form={form} setForm={setForm} errors={errors} characters={characters} />
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canMutate || submitting || Boolean(stale) || (!dirty && Boolean(record))}><Save size={16} />{submitting ? 'Сохраняем…' : 'Сохранить'}</Button>
        <Button variant="secondary" disabled={submitting || (record && !latest)} onClick={() => setResetOpen(true)}>{stale ? 'Загрузить серверную версию' : 'Сбросить форму'}</Button>
        <Button variant="secondary" disabled={submitting} onClick={() => navigate('/admin')}>К списку</Button>
      </div>
    </form>
    <Dialog open={resetOpen} onClose={() => setResetOpen(false)} title="Сбросить форму?">
      <p className="mb-4 text-sm text-slate-300">Введённый текст будет заменён последними загруженными данными.</p>
      <div className="flex gap-2"><Button variant="secondary" onClick={() => setResetOpen(false)}>Продолжить редактирование</Button><Button onClick={reset}>Сбросить</Button></div>
    </Dialog>
    <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} title={submitting ? 'Идёт сохранение' : 'Есть несохранённые изменения'} closeDisabled={submitting}>
      <p className="mb-4 text-sm text-slate-300">{submitting ? 'Дождитесь ответа сервера.' : 'Остаться в редакторе или уйти без сохранения?'}</p>
      <div className="flex gap-2"><Button onClick={() => blocker.reset?.()}>Остаться</Button>{!submitting && <Button variant="danger" onClick={() => blocker.proceed?.()}>Уйти без сохранения</Button>}</div>
    </Dialog>
  </>
}
