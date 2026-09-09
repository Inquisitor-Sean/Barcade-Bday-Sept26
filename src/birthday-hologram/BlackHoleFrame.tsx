import { useEffect, useRef } from 'react'
import { clamp } from './motion'

export const INTRO_DURATION = 3800
const ease = (v: number) => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x) }

interface Props { startedAt: number; paused: boolean; accent: string; highContrast: boolean }

export default function BlackHoleFrame({ startedAt, paused, accent, highContrast }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    let frame = 0, width = 0, height = 0, lastDraw = 0

    function resize() {
      if (!canvas || !ctx) return
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(performance.now())
    }

    function draw(now: number) {
      if (!ctx) return
      const elapsed = paused ? INTRO_DURATION : now - startedAt
      const p = clamp(elapsed / INTRO_DURATION, 0, 1)
      const t = paused ? 0 : now / 1000
      const inset = width < 600 ? 8 : 18
      const a = Math.max(1, width / 2 - inset), b = Math.max(1, height / 2 - inset)
      const circle = 3 + Math.min(a, b) * 0.58 * ease(p / 0.45)
      const spread = ease((p - 0.29) / 0.71)
      const segments = 280
      const points: { x: number; y: number }[] = []
      const cut = width < 600 ? 14 : 24
      for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2
        const cos = Math.cos(angle), sin = Math.sin(angle)
        const cx = Math.abs(cos), sy = Math.abs(sin)
        const rect = Math.min(a / Math.max(cx, 0.0001), b / Math.max(sy, 0.0001), (a + b - cut) / (cx + sy))
        const radius = circle + (rect - circle) * spread
        const flutter = paused ? 0 : (1 - spread) * (Math.sin(angle * 23 + t * 3) + Math.sin(angle * 41 - t * 5)) * 1.5
        points.push({ x: width / 2 + cos * (radius + flutter), y: height / 2 + sin * (radius + flutter) })
      }
      ctx.clearRect(0, 0, width, height)
      const trace = () => {
        ctx.beginPath()
        points.forEach((point, i) => i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y))
      }
      trace()
      ctx.fillStyle = '#010408'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.globalAlpha = highContrast ? 0.6 : 0.22
      ctx.lineWidth = p === 1 ? 8 : 14
      ctx.shadowBlur = highContrast ? 0 : 28
      ctx.shadowColor = accent
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = highContrast ? 1 : 0.8
      ctx.lineWidth = 1.3
      ctx.stroke()

      if (p < 0.88) {
        const brightness = (1 - ease((p - 0.55) / 0.33)) * 0.24
        for (let ring = 1; ring < 4; ring++) {
          ctx.beginPath()
          const factor = 1 + ring * 0.028
          points.forEach((point, i) => {
            const px = width / 2 + (point.x - width / 2) * factor
            const py = height / 2 + (point.y - height / 2) * factor
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
          })
          ctx.globalAlpha = brightness / ring
          ctx.stroke()
        }
      }

      for (let trail = 0; trail < 4; trail++) {
        const begin = Math.floor(((t * 0.032 + trail / 4) % 1) * segments)
        ctx.beginPath()
        for (let j = 0; j < 13; j++) {
          const point = points[(begin + j) % segments]
          if (j === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y)
        }
        ctx.globalAlpha = highContrast ? 1 : 0.55
        ctx.strokeStyle = '#dffbff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.strokeStyle = accent
      ctx.fillStyle = accent
      for (let i = 0; i < 18; i++) {
        const point = points[Math.floor(((i / 18 + t * 0.008) % 1) * segments)]
        const dx = point.x - width / 2, dy = point.y - height / 2
        const offset = 1.015 + (1 - spread) * 0.04
        ctx.globalAlpha = highContrast ? 0.55 : 0.16 + 0.08 * Math.sin(i * 2 + t)
        ctx.fillRect(Math.round((width / 2 + dx * offset) / 3) * 3, Math.round((height / 2 + dy * offset) / 3) * 3, 3, 3)
      }
      ctx.globalAlpha = 1
    }

    function loop(now: number) {
      frame = 0
      if (document.hidden) return
      if (now - lastDraw > 32) { draw(now); lastDraw = now }
      if (!paused) frame = requestAnimationFrame(loop)
    }

    function visibility() {
      cancelAnimationFrame(frame)
      frame = 0
      if (!document.hidden) { draw(performance.now()); if (!paused) frame = requestAnimationFrame(loop) }
    }
    resize()
    if (!paused) frame = requestAnimationFrame(loop)
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [startedAt, paused, accent, highContrast])

  return <canvas ref={ref} className="black-hole-frame" aria-hidden="true" />
}
