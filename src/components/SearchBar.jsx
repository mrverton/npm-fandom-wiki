import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Найти персонажа, арку...', autoFocus = false }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-qzero/20 via-cortex/10 to-verton/10 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300 pointer-events-none" />
      <div className="relative flex items-center gap-2.5 rounded-2xl border border-base-600/70 bg-base-850/90 px-4 py-3 backdrop-blur-sm transition-colors duration-200 focus-within:border-qzero/60">
        <Search size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-body"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            aria-label="Очистить поиск"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
