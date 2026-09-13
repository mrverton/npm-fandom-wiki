export default function Button({ variant = 'primary', className = '', type = 'button', children, ...props }) {
  const variants = {
    primary: 'border-qzero/50 bg-qzero/10 text-qzero hover:bg-qzero/20',
    secondary: 'border-base-600 bg-base-800 text-slate-200 hover:border-slate-500',
    danger: 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  }
  return <button type={type} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props}>{children}</button>
}
