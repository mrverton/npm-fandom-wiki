import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Native top-layer dialog: focus containment, Escape and backdrop dismissal. */
export default function Dialog({ open, onClose, title, children, closeDisabled = false }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const element = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
    element.querySelector('button, input, select, textarea, [tabindex="0"]')?.focus()
    return () => {
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])
  if (!open) return null
  const close = () => { if (!closeDisabled) onClose() }
  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-modal="true" className="wiki-dialog"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); close() }
        if (event.key !== 'Tab') return
        const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')]
        const first = focusable[0], last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}>
      <div className="wiki-dialog-body">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id={titleId} className="font-display font-bold text-xl text-slate-50">{title}</h2>
          <button type="button" onClick={close} disabled={closeDisabled} className="icon-button" aria-label="Закрыть"><X size={18} /></button>
        </div>
        {children}
      </div>
    </dialog>, document.body,
  )
}
