import { useEffect, useRef } from 'react'
import { palette } from '../styles/tokens'

const COLORS = ['qzero', 'verton', 'cortex', 'terton'].map((key) => palette[key].DEFAULT)

/** Decorative canvas pauses when hidden and respects reduced motion. */
export default function ConstellationBackground({ variant = 'network' }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return
    let width = 0, height = 0, frame = 0, visible = true
    let particles = []
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(scale, 0, 0, scale, 0, 0)
      particles = Array.from({ length: variant === 'stars' ? 75 : 38 }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.3 + 0.4, alpha: Math.random() * 0.35 + 0.25,
        color: variant === 'stars' ? palette.timeline.gold : COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
      render()
    }
    const render = () => {
      if (width <= 0 || height <= 0) return
      context.clearRect(0, 0, width, height)
      for (const point of particles) {
        if (!motion?.matches) {
          point.x = (point.x + point.vx + width) % width
          point.y = (point.y + point.vy + height) % height
        }
        context.globalAlpha = point.alpha
        context.fillStyle = point.color
        context.beginPath()
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        context.fill()
      }
      if (variant === 'network') {
        for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance > 110) continue
          context.globalAlpha = (1 - distance / 110) * 0.18
          context.strokeStyle = a.color
          context.lineWidth = 0.6
          context.beginPath()
          context.moveTo(a.x, a.y)
          context.lineTo(b.x, b.y)
          context.stroke()
        }
      }
      context.globalAlpha = 1
    }
    const animate = () => {
      render()
      frame = requestAnimationFrame(animate)
    }
    const syncAnimation = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden && visible && !motion?.matches) frame = requestAnimationFrame(animate)
      else render()
    }
    resize()
    syncAnimation()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null
    observer?.observe(canvas)
    const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncAnimation()
    }) : null
    intersection?.observe(canvas)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', syncAnimation)
    motion?.addEventListener?.('change', syncAnimation)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      intersection?.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', syncAnimation)
      motion?.removeEventListener?.('change', syncAnimation)
    }
  }, [variant])
  return <canvas ref={canvasRef} aria-hidden="true" className={`${variant === 'network' ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none`} />
}
