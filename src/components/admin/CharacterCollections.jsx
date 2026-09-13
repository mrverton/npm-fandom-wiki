import { Plus, Trash2 } from 'lucide-react'
import Button from '../common/Button.jsx'
import Field from '../common/Field.jsx'

export default function CharacterCollections({ form, setForm, errors, characters }) {
  const add = (field, value) => setForm(previous => ({ ...previous, [field]: [...previous[field], value] }))
  const remove = (field, index) => setForm(previous => ({ ...previous, [field]: previous[field].filter((_, itemIndex) => itemIndex !== index) }))
  const change = (field, index, value) => setForm(previous => ({ ...previous, [field]: previous[field].map((item, itemIndex) => itemIndex === index ? value : item) }))
  return <>
    <section className="panel p-4 space-y-3"><h2 className="font-display text-xl text-verton">Способности</h2>
      {errors.abilities && <p className="text-rose-300 text-xs">{errors.abilities}</p>}
      {form.abilities.map((item, index) => <div key={index} className="flex items-end gap-2"><div className="flex-1"><Field name={`abilities.${index}`} label={`Способность ${index + 1}`} value={item} onChange={event => change('abilities', index, event.target.value)} error={errors[`abilities.${index}`]} maxLength={1000} /></div><Button variant="danger" aria-label={`Убрать способность ${index + 1}`} onClick={() => remove('abilities', index)}><Trash2 size={16} /></Button></div>)}
      <Button variant="secondary" disabled={form.abilities.length >= 100} onClick={() => add('abilities', '')}><Plus size={14} />Добавить способность</Button>
    </section>
    <section className="panel p-4 space-y-3"><h2 className="font-display text-xl text-cortex">Отношения</h2>
      {errors.relationships && <p className="text-rose-300 text-xs">{errors.relationships}</p>}
      {form.relationships.map((item, index) => <div key={index} className="space-y-2 border-b border-base-700 pb-3">
        <Field as="select" name={`relationships.${index}.slug`} label={`Персонаж связи ${index + 1}`} value={item.slug} onChange={event => change('relationships', index, { ...item, slug: event.target.value })} error={errors[`relationships.${index}.slug`]}>
          <option value="">Выберите персонажа</option>
          {item.slug && !characters.some(character => character.slug === item.slug) && <option value={item.slug}>{item.slug} (статья удалена)</option>}
          {characters.filter(character => character.slug !== form.slug).map(character => <option key={character.slug} value={character.slug}>{character.name}</option>)}
        </Field>
        <Field as="textarea" rows={2} name={`relationships.${index}.description`} label={`Описание связи ${index + 1}`} value={item.description} onChange={event => change('relationships', index, { ...item, description: event.target.value })} error={errors[`relationships.${index}.description`]} maxLength={5000} />
        <Button variant="danger" onClick={() => remove('relationships', index)}><Trash2 size={14} />Убрать связь {index + 1}</Button>
      </div>)}
      <Button variant="secondary" disabled={form.relationships.length >= 100} onClick={() => add('relationships', { slug: '', description: '' })}><Plus size={14} />Добавить связь</Button>
    </section>
    <section className="panel p-4 space-y-3"><h2 className="font-display text-xl text-qzero">Появления</h2>
      {errors.appearances && <p className="text-rose-300 text-xs">{errors.appearances}</p>}
      {form.appearances.map((item, index) => <div key={index} className="space-y-2 border-b border-base-700 pb-3">
        <Field name={`appearances.${index}.episode`} label={`Эпизод ${index + 1}`} value={item.episode} onChange={event => change('appearances', index, { ...item, episode: event.target.value })} error={errors[`appearances.${index}.episode`]} maxLength={200} />
        <Field as="textarea" rows={2} name={`appearances.${index}.summary`} label={`Описание появления ${index + 1}`} value={item.summary} onChange={event => change('appearances', index, { ...item, summary: event.target.value })} error={errors[`appearances.${index}.summary`]} maxLength={10000} />
        <Button variant="danger" onClick={() => remove('appearances', index)}><Trash2 size={14} />Убрать появление {index + 1}</Button>
      </div>)}
      <Button variant="secondary" disabled={form.appearances.length >= 200} onClick={() => add('appearances', { episode: '', summary: '' })}><Plus size={14} />Добавить появление</Button>
    </section>
  </>
}
