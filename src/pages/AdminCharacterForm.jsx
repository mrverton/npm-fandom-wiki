import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import { useCharacters } from '../context/CharactersContext'

const COLOR_OPTIONS = [
  { value: 'verton', label: 'Зелёный (Вертон)' },
  { value: 'qzero', label: 'Неоновый синий (Кьюзеро)' },
  { value: 'cortex', label: 'Фиолетовый (Кортекс)' },
  { value: 'terton', label: 'Призрачно-серый (Тертон)' },
]

const STATUS_OPTIONS = ['Жив', 'Жива', 'Мертв', 'Неизвестно', 'Связь потеряна']

const emptyForm = {
  slug: '',
  name: '',
  shortName: '',
  color: 'qzero',
  status: 'Жив',
  arc: '',
  role: '',
  occupation: '',
  race: '',
  avatarInitial: '',
  biography: '',
  abilities: [''],
  relationships: [{ id: '', description: '' }],
  appearances: [{ episode: '', summary: '' }],
}

function inputClass() {
  return 'w-full bg-base-800/70 border border-base-600/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-qzero/60 transition-colors'
}

function labelClass() {
  return 'block text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-1.5'
}

export default function AdminCharacterForm() {
  const { slug } = useParams()
  const isEditMode = Boolean(slug)
  const navigate = useNavigate()
  const { characters, addCharacter, editCharacter } = useCharacters()

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (!isEditMode) return
    const existing = characters.find((c) => c.id === slug)
    if (existing) {
      setForm({
        slug: existing.slug,
        name: existing.name,
        shortName: existing.shortName,
        color: existing.color,
        status: existing.status,
        arc: existing.arc || '',
        role: existing.role || '',
        occupation: existing.occupation || '',
        race: existing.race || '',
        avatarInitial: existing.avatarInitial || '',
        biography: existing.biography || '',
        abilities: existing.abilities?.length ? existing.abilities : [''],
        relationships: existing.relationships?.length
          ? existing.relationships
          : [{ id: '', description: '' }],
        appearances: existing.appearances?.length
          ? existing.appearances.map((a) => ({ episode: a.episode, summary: a.summary }))
          : [{ episode: '', summary: '' }],
      })
    }
  }, [isEditMode, slug, characters])

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const updateListItem = (field, index, value) => {
    setForm((f) => {
      const list = [...f[field]]
      list[index] = value
      return { ...f, [field]: list }
    })
  }

  const updateObjectListItem = (field, index, key, value) => {
    setForm((f) => {
      const list = [...f[field]]
      list[index] = { ...list[index], [key]: value }
      return { ...f, [field]: list }
    })
  }

  const addListItem = (field, emptyValue) => {
    setForm((f) => ({ ...f, [field]: [...f[field], emptyValue] }))
  }

  const removeListItem = (field, index) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      color: form.color,
      status: form.status,
      arc: form.arc.trim(),
      role: form.role.trim(),
      occupation: form.occupation.trim(),
      race: form.race.trim() || null,
      avatarInitial: form.avatarInitial.trim() || '?',
      biography: form.biography,
      abilities: form.abilities.map((a) => a.trim()).filter(Boolean),
      relationships: form.relationships
        .filter((r) => r.id.trim() && r.description.trim())
        .map((r) => ({ id: r.id.trim(), description: r.description.trim() })),
      appearances: form.appearances
        .filter((a) => a.episode.trim())
        .map((a) => ({ episode: a.episode.trim(), summary: a.summary.trim() })),
    }

    if (!payload.slug || !payload.name || !payload.shortName) {
      setErrorMsg('Заполни хотя бы slug, имя и короткое имя персонажа.')
      return
    }

    setSaving(true)
    try {
      if (isEditMode) {
        const existing = characters.find((c) => c.id === slug)
        if (existing?.dbId == null) {
          throw new Error('У этого персонажа нет ID в базе данных — он ещё не синхронизирован с бэкендом.')
        }
        await editCharacter(existing.dbId, payload)
      } else {
        await addCharacter(payload)
      }
      navigate('/admin')
    } catch (err) {
      setErrorMsg(err.message || 'Не удалось сохранить персонажа')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      header={
        <TopBar
          title={isEditMode ? 'Редактировать персонажа' : 'Новый персонаж'}
          subtitle="admin panel"
          showBack
          accentClass="text-cortex"
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {errorMsg && (
          <div className="panel p-3.5 border border-rose-500/40 text-xs text-rose-400 leading-snug">
            {errorMsg}
          </div>
        )}

        {/* Основное */}
        <div className="panel p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Основное</h3>

          <div>
            <label className={labelClass()}>Slug (латиницей, для ссылки)</label>
            <input
              className={inputClass()}
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder="например: newchar"
              disabled={isEditMode}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Полное имя</label>
              <input
                className={inputClass()}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Мистер Икс"
              />
            </div>
            <div>
              <label className={labelClass()}>Короткое имя</label>
              <input
                className={inputClass()}
                value={form.shortName}
                onChange={(e) => update('shortName', e.target.value)}
                placeholder="Икс"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Цветовая тема</label>
              <select
                className={inputClass()}
                value={form.color}
                onChange={(e) => update('color', e.target.value)}
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass()}>Статус</label>
              <select
                className={inputClass()}
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Раса (необязательно)</label>
              <input
                className={inputClass()}
                value={form.race}
                onChange={(e) => update('race', e.target.value)}
                placeholder="Человек / оставь пустым"
              />
            </div>
            <div>
              <label className={labelClass()}>Инициал аватара</label>
              <input
                className={inputClass()}
                value={form.avatarInitial}
                onChange={(e) => update('avatarInitial', e.target.value)}
                placeholder="X"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className={labelClass()}>Текущая арка</label>
            <input
              className={inputClass()}
              value={form.arc}
              onChange={(e) => update('arc', e.target.value)}
              placeholder="Эпизод 2: Bloodness Income"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Роль</label>
              <input
                className={inputClass()}
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>Деятельность</label>
              <input
                className={inputClass()}
                value={form.occupation}
                onChange={(e) => update('occupation', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass()}>Биография</label>
            <textarea
              className={`${inputClass()} min-h-[120px] resize-y`}
              value={form.biography}
              onChange={(e) => update('biography', e.target.value)}
              placeholder="Можно оборачивать спойлеры в ||двойные палки||"
            />
          </div>
        </div>

        {/* Способности */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Способности</h3>
            <button
              type="button"
              onClick={() => addListItem('abilities', '')}
              className="text-verton text-xs flex items-center gap-1"
            >
              <Plus size={13} /> добавить
            </button>
          </div>
          {form.abilities.map((ability, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass()}
                value={ability}
                onChange={(e) => updateListItem('abilities', i, e.target.value)}
                placeholder="Название — описание способности"
              />
              <button
                type="button"
                onClick={() => removeListItem('abilities', i)}
                className="shrink-0 w-10 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Отношения */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Отношения</h3>
            <button
              type="button"
              onClick={() => addListItem('relationships', { id: '', description: '' })}
              className="text-verton text-xs flex items-center gap-1"
            >
              <Plus size={13} /> добавить
            </button>
          </div>
          {form.relationships.map((rel, i) => (
            <div key={i} className="space-y-2 pb-2 border-b border-base-600/40 last:border-none">
              <div className="flex gap-2">
                <select
                  className={inputClass()}
                  value={rel.id}
                  onChange={(e) => updateObjectListItem('relationships', i, 'id', e.target.value)}
                >
                  <option value="">— выбери персонажа —</option>
                  {characters
                    .filter((c) => c.id !== form.slug)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeListItem('relationships', i)}
                  className="shrink-0 w-10 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className={inputClass()}
                value={rel.description}
                onChange={(e) => updateObjectListItem('relationships', i, 'description', e.target.value)}
                placeholder="создатель / лучший друг"
              />
            </div>
          ))}
        </div>

        {/* История появлений */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">История появлений</h3>
            <button
              type="button"
              onClick={() => addListItem('appearances', { episode: '', summary: '' })}
              className="text-verton text-xs flex items-center gap-1"
            >
              <Plus size={13} /> добавить
            </button>
          </div>
          {form.appearances.map((app, i) => (
            <div key={i} className="space-y-2 pb-2 border-b border-base-600/40 last:border-none">
              <div className="flex gap-2">
                <input
                  className={inputClass()}
                  value={app.episode}
                  onChange={(e) => updateObjectListItem('appearances', i, 'episode', e.target.value)}
                  placeholder="Эпизод 1 — Детство"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('appearances', i)}
                  className="shrink-0 w-10 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className={`${inputClass()} min-h-[70px] resize-y`}
                value={app.summary}
                onChange={(e) => updateObjectListItem('appearances', i, 'summary', e.target.value)}
                placeholder="Краткое описание того, что произошло"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-verton/50 bg-verton/15 text-verton py-3 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Сохраняю...' : isEditMode ? 'Сохранить изменения' : 'Создать персонажа'}
        </button>
      </form>
    </Layout>
  )
}
