import { useState } from 'react'
import { Star, Sparkles } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import ConstellationBackground from '../components/ConstellationBackground'
import Dialog from '../components/common/Dialog'
import ArcContent from '../components/ArcContent'
import { useCharacters } from '../context/CharactersContext'
import { useTelegram } from '../hooks/useTelegram'
import { isArcAvailable } from '../data/editorial'
import { palette } from '../styles/tokens'
import '../styles/timeline.css'

// Original visual geometry. Text and availability always come from editorial data.
const POINTS = [
  { id: 'arc-0', label: '0 Арка', x: 90, y: 70 },
  { id: 'arc-1', label: '1 Арка', x: 235, y: 260 },
  { id: 'arc-2', label: '2 Арка', x: 85, y: 460 },
  { id: 'arc-3', label: '3 Арка', x: 235, y: 650 },
  { id: 'arc-rr', label: 'RR', x: 300, y: 470, red: true },
]
const GOLD_PATH = 'M 90 70 C 170 130, 175 195, 235 260 C 300 320, 15 380, 85 460 C 155 535, 165 585, 235 650 C 270 685, 225 740, 175 800'
const RED_PATH = 'M 235 650 C 280 610, 260 520, 300 470'

export default function Timeline() {
  const { series } = useCharacters()
  const { hapticImpact } = useTelegram()
  const [selectedId, setSelectedId] = useState(null)
  const [pointer, setPointer] = useState(null)
  const arcs = series?.arcs ?? []
  const selectedArc = arcs.find(arc => arc.id === selectedId)
  function trackPointer(event) {
    if (event.pointerType !== 'mouse' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width && rect.height) setPointer({ x: (event.clientX - rect.left) / rect.width * 320, y: (event.clientY - rect.top) / rect.height * 900 })
  }
  return <Layout header={<TopBar title="Хронология" subtitle="npm universe" showBack accentClass="text-qzero" />}>
    <div className="text-center pt-2 pb-4">
      <Sparkles size={15} className="mx-auto text-amber-200/60" />
      <h2 className="font-display font-bold text-2xl tracking-[0.15em] text-amber-200 mt-1">НПМ UNIVERSE</h2>
      <p className="text-[11px] font-mono uppercase tracking-widest text-amber-200/50">Священная линия времени</p>
    </div>
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-base-950" style={{ aspectRatio: '320 / 900' }} onPointerMove={trackPointer} onPointerLeave={() => setPointer(null)}>
      <ConstellationBackground variant="stars" />
      <svg viewBox="0 0 320 900" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="timelineGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={palette.timeline.gold} /><stop offset="50%" stopColor={palette.timeline.middle} /><stop offset="100%" stopColor={palette.timeline.dim} stopOpacity="0.4" /></linearGradient>
          <linearGradient id="timelineRed" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={palette.timeline.redDim} /><stop offset="100%" stopColor={palette.timeline.red} /></linearGradient>
          <filter id="timelineGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d={GOLD_PATH} fill="none" stroke="url(#timelineGold)" strokeWidth="2.4" strokeLinecap="round" filter="url(#timelineGlow)" className="timeline-thread" />
        {[0, 1, 2].map(index => <path key={index} d={GOLD_PATH} fill="none" stroke={palette.timeline.bright} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 236" className="timeline-flow" style={{ animationDelay: `${index * 1.5}s` }} />)}
        <path d={RED_PATH} fill="none" stroke="url(#timelineRed)" strokeWidth="2.2" strokeLinecap="round" filter="url(#timelineGlow)" />
      </svg>
      {POINTS.map(point => {
        const arc = arcs.find(item => item.id === point.id)
        if (!arc) return null
        const distance = pointer ? Math.hypot(pointer.x - point.x, pointer.y - point.y) : 0
        const pull = distance > 0 && distance < 70 ? (1 - distance / 70) * 16 / distance : 0
        const dx = pointer ? (pointer.x - point.x) * pull : 0
        const dy = pointer ? (pointer.y - point.y) * pull : 0
        return <button key={point.id} type="button" aria-label={arc.title} aria-haspopup="dialog" onClick={() => { hapticImpact('medium'); setSelectedId(point.id) }}
          className={`absolute min-w-11 min-h-11 flex flex-col items-center justify-center gap-1 rounded-xl transition-transform ${point.red ? 'text-red-300' : isArcAvailable(arc) ? 'text-amber-100' : 'text-amber-200/50'}`}
          style={{ left: `${point.x / 320 * 100}%`, top: `${point.y / 900 * 100}%`, transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)` }}>
          <Star size={22} fill="currentColor" strokeWidth={0} className="timeline-star" /><span className="font-display text-xs font-semibold whitespace-nowrap">{point.label}</span>
        </button>
      })}
    </div>
    <p className="text-xs text-slate-500 text-center mt-3">Коснись звезды, чтобы узнать больше об арке</p>
    <Dialog open={Boolean(selectedArc)} onClose={() => setSelectedId(null)} title={selectedArc?.title || 'Сюжетная арка'}>
      {selectedArc && <ArcContent arc={selectedArc} />}
    </Dialog>
  </Layout>
}
