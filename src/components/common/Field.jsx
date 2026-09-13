export default function Field({ name, label, value, onChange, error, as: Element = 'input', children, hint, ...props }) {
  const id = `field-${name}`
  return <div>
    <label htmlFor={id} className="block mb-1.5 text-xs font-mono tracking-wide text-slate-400">{label}</label>
    <Element id={id} name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className="w-full rounded-xl border border-base-600 bg-base-800/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-qzero disabled:opacity-60" {...props}>{children}</Element>
    {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p id={`${id}-error`} className="mt-1 text-xs text-rose-300">{error}</p>}
  </div>
}
