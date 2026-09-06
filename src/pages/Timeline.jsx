import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Star, Lock, X, Play, Loader2, Sparkles } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import { useCharacters } from '../context/CharactersContext'
import { useTelegram } from '../hooks/useTelegram'

/**
 * ИСТОЧНИК ИСТИНЫ: series.arcs (см. также Arcs.jsx — оба экрана читают
 * ОДНО и то же поле, чтобы данные не расходились).
 *
 * ОЖИДАЕМАЯ ФОРМА ДАННЫХ (необязательна — компонент безопасно работает и без неё):
 *
 * series.arcs = [
 *   {
 *     id: 'arc-0' | 'arc-1' | 'arc-2' | 'arc-3' | 'arc-rr',
 *     title: '0 Арка',
 *     desc: 'текст описания арки' | description: '...',
 *     status: 'Доступна' | 'В разработке',
 *     isAvailable: true | false,
 *     characters: ['verton', 'qzero', ...],   // не используется на этом экране,
 *                                              // но входит в общую схему (см. Arcs.jsx)
 *     episodes: [
 *       { number: 1, title: 'Детство', desc: '...' | description: '...' },
 *       { number: 2, title: 'Bloodness Income', desc: '...' | description: '...' },
 *     ],
 *   },
 *   ...
 * ]
 *
 * Если series.arcs отсутствует или конкретная арка не найдена — компонент
 * подставляет безопасные заглушки и ничего не ломает.
 */

// Визуальные узлы "Священной линии времени" — их геометрия фиксирована
// (это дизайн экрана), а текстовое наполнение подтягивается из series.arcs.
// viewBox: 0 0 320 900 (вертикальная раскладка под мобильный экран)
const ARC_POINTS = [
  { id: 'arc-0', number: 0, label: '0 Арка', x: 90, y: 70, kind: 'gold' },
  { id: 'arc-1', number: 1, label: '1 Арка', x: 235, y: 260, kind: 'gold' },
  { id: 'arc-2', number: 2, label: '2 Арка', x: 85, y: 460, kind: 'gold' },
  { id: 'arc-3', number: 3, label: '3 Арка', x: 235, y: 650, kind: 'gold' },
  { id: 'arc-rr', number: null, label: 'RR', x: 300, y: 470, kind: 'red' },
]

const VIEW_W = 320
const VIEW_H = 900

// Золотая "каноничная" нить — проходит через 0,1,2,3 Арку и уходит дальше вниз,
// намекая, что канон продолжается за пределами известного.
const GOLD_PATH =
    'M 90 70 C 170 130, 175 195, 235 260 ' +
    'C 300 320, 15 380, 85 460 ' +
    'C 155 535, 165 585, 235 650 ' +
    'C 270 685, 225 740, 175 800'

// Красная альтернативная ветка — ответвляется от 3 Арки вверх к аномалии "RR".
const RED_PATH = 'M 235 650 C 280 610, 260 520, 300 470'

const MAGNET_RADIUS = 70 // в единицах viewBox
const MAGNET_STRENGTH = 16 // максимальное смещение точки к курсору, тоже в units viewBox

function getYoutubeUrl(episodeNumber) {
  if (episodeNumber === 1) return 'https://www.youtube.com/watch?v=F1QQtOQ9X84'
  if (episodeNumber === 2) return 'https://www.youtube.com/watch?v=MRYtTh-WzJM'
  return null
}

function findArcData(seriesArcs, pointId) {
  if (!Array.isArray(seriesArcs)) return null
  return seriesArcs.find((a) => a?.id === pointId) || null
}

// ---------- Звёздное небо на Canvas (лёгкий параллакс + мерцание) ----------
function useStarfieldCanvas(canvasRef, containerRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    let W, H
    let stars = []
    let animId

    function resize() {
      const rect = container.getBoundingClientRect()
      W = canvas.width = rect.width
      H = canvas.height = rect.height
    }

    function makeStars() {
      const count = Math.floor((W * H) / 3200)
      stars = Array.from({ length: Math.max(count, 40) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        vy: Math.random() * 0.02 + 0.008, // очень медленный дрейф вниз
      }))
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) {
        s.y += s.vy
        if (s.y > H) s.y = 0
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 244, 214, ${s.baseAlpha * twinkle})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    makeStars()
    animId = requestAnimationFrame(draw)

    const ro = new ResizeObserver(() => {
      resize()
      makeStars()
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [canvasRef, containerRef])
}

export default function Timeline() {
  const { series, loading } = useCharacters()
  const { hapticImpact } = useTelegram()

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  useStarfieldCanvas(canvasRef, containerRef)

  const [pointerSvg, setPointerSvg] = useState(null) // {x, y} в координатах viewBox, либо null
  const [selectedArc, setSelectedArc] = useState(null) // ARC_POINTS-элемент, либо null
  const [sheetVisible, setSheetVisible] = useState(false)

  const toSvgCoords = useCallback((clientX, clientY) => {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const relX = (clientX - rect.left) / rect.width
    const relY = (clientY - rect.top) / rect.height
    return { x: relX * VIEW_W, y: relY * VIEW_H }
  }, [])

  const handlePointerMove = useCallback(
      (e) => {
        const coords = toSvgCoords(e.clientX, e.clientY)
        setPointerSvg(coords)
      },
      [toSvgCoords]
  )

  const handlePointerLeave = useCallback(() => {
    setPointerSvg(null)
  }, [])

  // Смещение каждой точки к курсору (эффект магнита), с плавным
  // возвратом на место через CSS transition, когда курсор уходит.
  const magnetOffsets = useMemo(() => {
    const offsets = {}
    for (const p of ARC_POINTS) {
      if (!pointerSvg) {
        offsets[p.id] = { dx: 0, dy: 0 }
        continue
      }
      const dx = pointerSvg.x - p.x
      const dy = pointerSvg.y - p.y
      const dist = Math.hypot(dx, dy)
      if (dist < MAGNET_RADIUS && dist > 0.001) {
        const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH
        offsets[p.id] = { dx: (dx / dist) * pull, dy: (dy / dist) * pull }
      } else {
        offsets[p.id] = { dx: 0, dy: 0 }
      }
    }
    return offsets
  }, [pointerSvg])

  const openArc = useCallback(
      (point) => {
        hapticImpact('medium')
        setSelectedArc(point)
        requestAnimationFrame(() => setSheetVisible(true))
      },
      [hapticImpact]
  )

  const closeArc = useCallback(() => {
    setSheetVisible(false)
    setTimeout(() => setSelectedArc(null), 220)
  }, [])

  if (loading) {
    return (
        <Layout header={<TopBar title="Хронология" subtitle="npm universe" showBack accentClass="text-qzero" />}>
          <div className="flex flex-col items-center justify-center text-center py-20 animate-fade-in">
            <Loader2 size={22} className="text-slate-600 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Загружаю карту вселенной...</p>
          </div>
        </Layout>
    )
  }

  const arcData = selectedArc ? findArcData(series?.arcs, selectedArc.id) : null
  const isLocked = selectedArc
      ? arcData
          ? arcData.isAvailable === false || arcData.status === 'В разработке'
          : selectedArc.id === 'arc-2' || selectedArc.id === 'arc-3'
      : false

  return (
      <Layout
          header={<TopBar title="Хронология" subtitle="npm universe" showBack accentClass="text-qzero" />}
          noPadding
      >
        <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes npmuTitleGlow {
              0%, 100% { filter: drop-shadow(0 0 6px rgba(245, 208, 130, 0.55)); }
              50% { filter: drop-shadow(0 0 14px rgba(245, 208, 130, 0.9)); }
            }
            @keyframes npmuBreathe {
              0%, 100% { opacity: 0.75; stroke-width: 2.2; }
              50% { opacity: 1; stroke-width: 3; }
            }
            @keyframes npmuRedBreathe {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 0.95; }
            }
            @keyframes npmuFlow {
              from { stroke-dashoffset: 240; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes npmuStarPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.16); }
            }
            @keyframes npmuSheetUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .npmu-gold-path { animation: npmuBreathe 3.6s ease-in-out infinite; }
            .npmu-red-path { animation: npmuRedBreathe 2.6s ease-in-out infinite; }
            .npmu-flow-dot { animation: npmuFlow 4.5s linear infinite; }
            .npmu-flow-dot-2 { animation: npmuFlow 4.5s linear infinite; animation-delay: 1.5s; }
            .npmu-flow-dot-3 { animation: npmuFlow 4.5s linear infinite; animation-delay: 3s; }
            .npmu-star-core { animation: npmuStarPulse 2.4s ease-in-out infinite; }
            .npmu-title { animation: npmuTitleGlow 3.2s ease-in-out infinite; }
          `,
            }}
        />

        {/* Заголовок-баннер в духе "НПМ UNIVERSE" */}
        <div className="px-4 pt-4 pb-2 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-200/50">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/40" />
            <Sparkles size={12} />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/40" />
          </div>
          <h1
              className="npmu-title font-display font-bold tracking-[0.15em] text-2xl mt-1 bg-clip-text text-transparent bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500"
          >
            НПМ UNIVERSE
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-widest text-amber-200/40 mt-0.5">
            Священная линия времени
          </p>
        </div>

        {/* Космическая панель с линией времени */}
        <div className="px-4">
          <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="relative w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-[#05060a]"
              style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
          >
            {/* Звёздный фон */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Лёгкое туманное свечение по центру для глубины */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(120,90,40,0.18),transparent_70%)]" />

            {/* SVG-линия времени */}
            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="npmuGoldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde9b8" />
                  <stop offset="50%" stopColor="#e8b95a" />
                  <stop offset="100%" stopColor="#7a5a24" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="npmuRedGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#7a1010" />
                  <stop offset="100%" stopColor="#ff5050" />
                </linearGradient>
                <filter id="npmuGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Золотая каноничная нить */}
              <path
                  d={GOLD_PATH}
                  fill="none"
                  stroke="url(#npmuGoldGrad)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  filter="url(#npmuGlow)"
                  className="npmu-gold-path"
              />

              {/* Бегущие частицы света вдоль золотой линии */}
              <path
                  d={GOLD_PATH}
                  fill="none"
                  stroke="#fff6dd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 236"
                  className="npmu-flow-dot"
                  opacity="0.9"
              />
              <path
                  d={GOLD_PATH}
                  fill="none"
                  stroke="#fff6dd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 236"
                  className="npmu-flow-dot-2"
                  opacity="0.9"
              />
              <path
                  d={GOLD_PATH}
                  fill="none"
                  stroke="#fff6dd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 236"
                  className="npmu-flow-dot-3"
                  opacity="0.9"
              />

              {/* Красная альтернативная ветка к RR */}
              <path
                  d={RED_PATH}
                  fill="none"
                  stroke="url(#npmuRedGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  filter="url(#npmuGlow)"
                  className="npmu-red-path"
              />
            </svg>

            {/* Интерактивные звёзды-арки поверх SVG */}
            {ARC_POINTS.map((point) => {
              const offset = magnetOffsets[point.id] || { dx: 0, dy: 0 }
              const leftPct = (point.x / VIEW_W) * 100
              const topPct = (point.y / VIEW_H) * 100
              const isRed = point.kind === 'red'
              const locked =
                  (findArcData(series?.arcs, point.id)?.isAvailable === false ||
                      findArcData(series?.arcs, point.id)?.status === 'В разработке') ||
                  (!findArcData(series?.arcs, point.id) && (point.id === 'arc-2' || point.id === 'arc-3'))

              return (
                  <div
                      key={point.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: `translate(-50%, -50%) translate(${offset.dx}px, ${offset.dy}px)`,
                      }}
                  >
                    <button
                        onClick={() => openArc(point)}
                        className="relative flex flex-col items-center gap-1.5 group outline-none"
                        aria-label={point.label}
                    >
                      {/* Ореол свечения за звездой */}
                      <span
                          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md ${
                              isRed ? 'bg-red-500/50 w-9 h-9' : locked ? 'bg-amber-500/15 w-7 h-7' : 'bg-amber-300/40 w-8 h-8'
                          }`}
                      />
                      <span
                          className={`npmu-star-core relative flex items-center justify-center w-6 h-6 rounded-full ${
                              isRed
                                  ? 'text-red-400'
                                  : locked
                                      ? 'text-amber-500/40'
                                      : 'text-amber-200'
                          }`}
                      >
                    <Star size={18} fill="currentColor" strokeWidth={0} />
                  </span>

                      <span
                          className={`text-[11px] font-display font-semibold tracking-wide whitespace-nowrap transition-all duration-200 hover:brightness-150 hover:scale-105 ${
                              isRed
                                  ? 'text-red-300'
                                  : locked
                                      ? 'text-amber-200/40'
                                      : 'text-amber-100/90'
                          }`}
                      >
                    {point.label}
                  </span>
                    </button>
                  </div>
              )
            })}
          </div>

          <p className="text-[11px] text-slate-600 text-center mt-2.5 mb-1">
            Коснись звезды, чтобы узнать больше об арке
          </p>
        </div>

        {/* Модальное окно арки — нижний шит */}
        {selectedArc && (
            <>
              <div
                  onClick={closeArc}
                  className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity duration-200 ${
                      sheetVisible ? 'opacity-100' : 'opacity-0'
                  }`}
              />
              <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
                <div
                    className="w-full max-w-lg rounded-t-3xl border-t border-amber-500/30 bg-base-950/95 backdrop-blur-md p-5 pb-8 transition-transform duration-300 ease-out"
                    style={{ transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                  <span
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border ${
                          selectedArc.kind === 'red'
                              ? 'border-red-500/40 bg-red-500/10 text-red-400'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}
                  >
                    <Star size={16} fill="currentColor" strokeWidth={0} />
                  </span>
                      <div>
                        <h2 className="font-display font-bold text-lg text-slate-50">
                          {arcData?.title || selectedArc.label}
                        </h2>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300/50">
                          {selectedArc.kind === 'red' ? 'аномальная ветка' : 'сюжетная арка'}
                        </p>
                      </div>
                    </div>
                    <button
                        onClick={closeArc}
                        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-base-600/60 text-slate-400 active:scale-90 transition-transform"
                        aria-label="Закрыть"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {isLocked ? (
                      <div className="flex flex-col items-center text-center py-8 gap-3">
                        <div className="w-12 h-12 rounded-full bg-base-800 border border-base-600 flex items-center justify-center">
                          <Lock size={20} className="text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400 max-w-[240px] leading-relaxed">
                          Временная ветка стабилизируется... Доступ заблокирован.
                        </p>
                      </div>
                  ) : (
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {arcData?.description ||
                              arcData?.desc ||
                              (selectedArc.kind === 'red'
                                  ? 'Обнаружена альтернативная временная линия. Записи о ней пока неполны.'
                                  : 'Данные об этой арке ещё заполняются.')}
                        </p>

                        {Array.isArray(arcData?.episodes) && arcData.episodes.length > 0 && (
                            <div className="space-y-2.5">
                              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Эпизоды</p>
                              {arcData.episodes.map((ep, i) => {
                                const url = getYoutubeUrl(ep.number)
                                return (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-base-600/50 bg-base-800/50 p-3"
                                    >
                                      <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/70">
                                        Эпизод {ep.number}
                                      </p>
                                      <p className="text-sm font-semibold text-slate-100 mt-0.5">{ep.title}</p>
                                      {(ep.desc || ep.description) && (
                                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {ep.desc || ep.description}
                                          </p>
                                      )}
                                      {url && (
                                          <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-600/10 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-600/20"
                                          >
                                            <Play size={12} fill="currentColor" />
                                            Смотреть серию
                                          </a>
                                      )}
                                    </div>
                                )
                              })}
                            </div>
                        )}
                      </div>
                  )}
                </div>
              </div>
            </>
        )}
      </Layout>
  )
}
