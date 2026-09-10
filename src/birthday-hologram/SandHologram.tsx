import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { MotionVector } from './motion'
import type { Palette } from './palette'

interface Props {
  motion: RefObject<MotionVector>
  colors: Palette
  paused: boolean
  opening: boolean
  eventView: boolean
}
export default function SandHologram(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const current = useRef(props)
  useEffect(() => {
    current.current = props
  }, [props])
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      time = 0
    let cameraX = 0,
      cameraY = 0,
      reveal = 0,
      eventMix = 0
    let seed = 61937
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const cloud = Array.from({ length: 16000 }, () => ({
      a: random() * Math.PI * 2,
      b: random() * Math.PI * 2,
      r: random(),
      light: random(),
      size: random(),
      speed: 0.3 + random() * 0.7,
    }))
    const dust = Array.from({ length: 330 }, () => ({
      x: random(),
      y: random(),
      z: random(),
      speed: 0.02 + random() * 0.045,
    }))
    function resize() {
      const box = canvas!.getBoundingClientRect()
      width = box.width
      height = box.height
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(0)
    }
    function draw(delta: number) {
      const { motion, colors, paused, opening, eventView } = current.current
      const dt = Math.min(delta, 0.06)
      if (!paused) time += dt
      const ease = paused ? 1 : 1 - Math.exp(-dt * 5)
      cameraX += ((paused ? 0 : motion.current.x) - cameraX) * ease
      cameraY += ((paused ? 0 : motion.current.y) - cameraY) * ease
      reveal += ((opening ? 1 : 0) - reveal) * ease
      eventMix += ((eventView ? 1 : 0) - eventMix) * ease
      if (paused) {
        reveal = 0
        eventMix = eventView ? 1 : 0
      }
      const energy = paused ? 0 : motion.current.energy
      motion.current.energy *= Math.exp(-dt * 7)
      ctx!.clearRect(0, 0, width, height)
      const scale = Math.min(width * 0.43, height * 0.39) * (1 + reveal * 0.7)
      const cx = width * (0.5 + eventMix * 0.21),
        cy = height * (0.47 + eventMix * 0.1)
      const fade = 1 - eventMix * 0.68
      const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.4)
      glow.addColorStop(0, colors.glow + '00')
      glow.addColorStop(0.5, colors.glow + '0b')
      glow.addColorStop(1, colors.glow + '00')
      ctx!.fillStyle = glow
      ctx!.fillRect(0, 0, width, height)
      ctx!.globalCompositeOperation = 'lighter'
      const count = width < 650 ? 3500 : width > 2400 ? 16000 : 8000
      const ry = -0.4 + cameraX * 0.15,
        rx = 0.84 + cameraY * 0.17
      const crx = Math.cos(rx),
        srx = Math.sin(rx),
        cry = Math.cos(ry),
        sry = Math.sin(ry)
      for (let i = 0; i < count; i++) {
        const p = cloud[i]
        const a = p.a + time * 0.055 * p.speed
        const b = p.b + Math.sin(a * 3 + time * 0.2) * 0.26
        const ripples =
          Math.sin(a * 9 + b * 5 + time * 0.4) * 0.021 +
          Math.sin(a * 17 - b * 8) * 0.012
        const tube = 0.18 + p.r * 0.11 + ripples
        const radius = 0.74 + Math.cos(b) * tube
        let x = Math.cos(a) * radius,
          y = Math.sin(a) * radius,
          z = Math.sin(b) * tube
        const y1 = y * crx - z * srx
        z = y * srx + z * crx
        y = y1
        const x1 = x * cry + z * sry
        z = -x * sry + z * cry
        x = x1
        const perspective = 2.9 / (2.9 - z)
        const drop =
          p.light > 0.91 ? ((time * 0.08 * p.speed + p.r) % 1) * 0.65 : 0
        const band = Math.sin(y * 90 + time * 1.8) > 0.87 ? 0.28 : 1
        const drift = energy * Math.sin(y * 24 + time * 14) * 27
        const px =
          cx + x * scale * perspective + cameraX * (z + 0.5) * 22 + drift
        const py = cy + (y + drop) * scale * perspective + cameraY * z * 16
        const light = Math.max(0.06, 0.35 + (-x * 0.6 - y * 0.65 + z * 0.3))
        ctx!.globalAlpha = Math.min(
          0.88,
          (0.14 + light * 0.6) * band * fade * (1 - drop),
        )
        ctx!.fillStyle =
          p.light > 0.84
            ? colors.rim
            : p.light > 0.3
              ? colors.accent
              : colors.dust
        const size =
          (0.45 + p.size * 0.9) *
          Math.min(2.1, Math.max(0.75, width / 1300)) *
          perspective
        ctx!.fillRect(px, py, size, size)
      }
      for (const p of dust) {
        const depth = 0.2 + p.z
        const x =
          (((p.x * width +
            Math.sin(time * 0.2 + p.y * 10) * 22 +
            cameraX * depth * 26) %
            width) +
            width) %
          width
        const y =
          ((p.y + time * p.speed * 0.05) % 1) * height + cameraY * depth * 16
        ctx!.fillStyle = p.z > 0.7 ? colors.rim : colors.dust
        ctx!.globalAlpha = (0.04 + p.z * 0.14) * (1 - eventMix * 0.5)
        const s = 0.6 + p.z * 1.3
        ctx!.fillRect(x, y, s, s * (p.z > 0.8 ? 2.2 : 1))
      }
      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = 'source-over'
    }
    function loop(now: number) {
      frame = 0
      if (document.hidden) return
      if (now - last > (current.current.paused ? 240 : 32)) {
        draw(last ? (now - last) / 1000 : 0.016)
        last = now
      }
      frame = requestAnimationFrame(loop)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    function visible() {
      cancelAnimationFrame(frame)
      last = 0
      if (!document.hidden) frame = requestAnimationFrame(loop)
    }
    document.addEventListener('visibilitychange', visible)
    resize()
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  return <canvas className="sand-scene" ref={canvasRef} aria-hidden="true" />
}
