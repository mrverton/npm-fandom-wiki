import { useEffect, useRef } from 'react'

const COLORS = ['#2fd6ff', '#39ff8a', '#b453ff', '#9aa3ad', '#2fd6ff', '#2fd6ff']
const PARTICLE_COUNT = 55
const CONNECTION_DIST = 110
const MOUSE_ATTRACT_DIST = 130
const MOUSE_ATTRACT_STRENGTH = 0.018

export default function ConstellationBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -999, y: -999 })
  const particlesRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      W = canvas.width = rect.width
      H = canvas.height = rect.height
    }

    function makeParticle() {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.6 + 0.8,
        color,
        alpha: Math.random() * 0.5 + 0.4,
      }
    }

    function init() {
      resize()
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, makeParticle)
    }

    function draw() {
      const particles = particlesRef.current
      const mouse = mouseRef.current
      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_ATTRACT_DIST && dist > 1) {
          p.vx += (dx / dist) * MOUSE_ATTRACT_STRENGTH
          p.vy += (dy / dist) * MOUSE_ATTRACT_STRENGTH
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.8) { p.vx = (p.vx / speed) * 1.8; p.vy = (p.vy / speed) * 1.8 }
        p.vx *= 0.995; p.vy *= 0.995
        p.x += p.vx; p.y += p.vy

        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Connections between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < CONNECTION_DIST) {
            const opacity = (1 - d / CONNECTION_DIST) * 0.35
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            grad.addColorStop(0, a.color)
            grad.addColorStop(1, b.color)
            ctx.strokeStyle = grad
            ctx.globalAlpha = opacity
            ctx.lineWidth = 0.7
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }

        // Connection to mouse
        const mdx = mouse.x - particles[i].x
        const mdy = mouse.y - particles[i].y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < MOUSE_ATTRACT_DIST) {
          const opacity = (1 - md / MOUSE_ATTRACT_DIST) * 0.55
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = particles[i].color
          ctx.globalAlpha = opacity
          ctx.lineWidth = 0.9
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    function getLocalPos(e) {
      const rect = canvas.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return { x: src.clientX - rect.left, y: src.clientY - rect.top }
    }

    const onMouseMove = (e) => { const p = getLocalPos(e); mouseRef.current = p }
    const onMouseLeave = () => { mouseRef.current = { x: -999, y: -999 } }
    const onTouchMove = (e) => { const p = getLocalPos(e); mouseRef.current = p }
    const onTouchEnd = () => { mouseRef.current = { x: -999, y: -999 } }

    const parent = canvas.parentElement
    parent.addEventListener('mousemove', onMouseMove)
    parent.addEventListener('mouseleave', onMouseLeave)
    parent.addEventListener('touchmove', onTouchMove, { passive: true })
    parent.addEventListener('touchend', onTouchEnd)

    const ro = new ResizeObserver(() => resize())
    ro.observe(parent)

    init()
    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      parent.removeEventListener('mousemove', onMouseMove)
      parent.removeEventListener('mouseleave', onMouseLeave)
      parent.removeEventListener('touchmove', onTouchMove)
      parent.removeEventListener('touchend', onTouchEnd)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, borderRadius: 'inherit' }}
    />
  )
}
