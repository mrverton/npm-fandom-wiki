import { Loader2 } from 'lucide-react'
export default function AsyncState({ title = 'Загружаем каталог…', loading = false, children }) {
  return <div className="panel p-8 text-center my-4" role="status" aria-live="polite">
    {loading && <Loader2 className="mx-auto mb-3 animate-spin text-qzero" aria-hidden="true" />}
    <p className="font-display text-xl text-slate-200">{title}</p>
    {children && <div className="mt-3 text-sm text-slate-400">{children}</div>}
  </div>
}
