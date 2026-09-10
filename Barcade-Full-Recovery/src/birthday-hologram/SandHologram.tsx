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
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const smooth = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x) }

export default function SandHologram(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const live = useRef(props)
  useEffect(() => { live.current = props }, [props])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const root = canvas?.parentElement
    if (!canvas || !ctx || !root) return
    let frame = 0, w = 1, h = 1, time = 0, previous = 0
    let tier = window.innerWidth < 700 ? 1 : 2
    let samples = 0, cost = 0, late = 0, openingTime = 0, openingStarted = 0
    let wasOpening = false, viewMix = 0, gx = 0, gy = 0
    let needsMeasure = true
    let bounds = { x: 0, y: 0, width: 1, height: 1 }
    let targets: { x: number; y: number; ink: boolean }[] = []
    let seed = 9737
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    // A rounded circular lock: a thick toroidal shoulder and a recessed
    // sand face. Random surface samples avoid contour bands and circuit lines.
    const grains = Array.from({ length: 5000 }, (_, i) => {
      let x = 0, y = 0, z = 0, nx = 0, ny = 0, nz = 1
      const shoulder = i % 10 < 6
      if (shoulder) {
        const a = random() * Math.PI * 2, b = random() * Math.PI * 2
        const tube = .255 * (.86 + random() * .14)
        const radius = .735 + tube * Math.cos(b)
        x = radius * Math.cos(a); y = radius * Math.sin(a)
        z = tube * Math.sin(b)
        nx = Math.cos(a) * Math.cos(b)
        ny = Math.sin(a) * Math.cos(b); nz = Math.sin(b)
      } else {
        // The keyhole is empty space in the material, never a drawn outline.
        do {
          const a = random() * Math.PI * 2, radius = Math.sqrt(random()) * .65
          x = Math.cos(a) * radius; y = Math.sin(a) * radius
        } while (Math.hypot(x, y + .1) < .155 ||
          (Math.abs(x) < .07 && y > -.03 && y < .32))
        z = .08 + .085 * (1 - (x*x + y*y) / .43) + (random() - .5) * .07
        nx = x * .4; ny = y * .4; nz = Math.sqrt(1 - nx*nx - ny*ny)
      }
      return { x, y, z, nx, ny, nz, shoulder,
        loose: random() < .23, phase: random() * Math.PI * 2,
        size: .65 + random() * .7, ox: 0, oy: 0, vx: 0, vy: 0 }
    })
    const air = Array.from({ length: 380 }, () => ({ x: random(), y: random(), z: random(), phase: random() * 6.28 }))
    const sizes = [1700, 3100, 5000]

    const clusters = new Map<string, HTMLCanvasElement>()
    let clusterPalette = ''
    function grainCluster(color: string, variant: number) {
      const key = `${color}:${tier}:${variant}`
      const cached = clusters.get(key)
      if (cached) return cached
      const stamp = document.createElement('canvas')
      stamp.width = stamp.height = 48
      const ink = stamp.getContext('2d')
      if (!ink) return null
      let state = 719 + variant * 103
      const noise = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        return state / 4294967296
      }
      ink.fillStyle = color
      const count = [10, 16, 24][tier]
      for (let n = 0; n < count; n++) {
        const angle = noise() * Math.PI * 2
        const radius = n === 0 ? 0 : Math.sqrt(noise()) * 18
        const size = 2.2 + noise() * 2.8
        ink.globalAlpha = .65 + noise() * .35
        ink.fillRect(24 + Math.cos(angle) * radius - size / 2,
          24 + Math.sin(angle) * radius - size / 2, size, size * (.75 + noise() * .4))
      }
      clusters.set(key, stamp)
      return stamp
    }

    function resize() {
      w = canvas!.clientWidth; h = canvas!.clientHeight
      const maxPixels = [650000, 1400000, 2400000][tier]
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(maxPixels / Math.max(1, w * h)))
      canvas!.width = Math.max(1, Math.round(w * ratio)); canvas!.height = Math.max(1, Math.round(h * ratio))
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0)
      needsMeasure = true
    }
    function measure() {
      needsMeasure = false
      const canvasRect = canvas!.getBoundingClientRect()
      const lock = root!.querySelector('.lock-trigger')?.getBoundingClientRect()
      if (lock) bounds = { x: lock.left - canvasRect.left, y: lock.top - canvasRect.top, width: lock.width, height: lock.height }
      targets = []
      const stamp = document.createElement('canvas')
      const ink = stamp.getContext('2d')
      root!.querySelectorAll<HTMLElement>('.utility-nav button, .event-title, .event-facts dd, .event-links button, .event-actions button, .event-actions a, .event-information').forEach(el => {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        const isFrame = el.classList.contains('event-information') || el.matches('button,a')
        if (isFrame) {
          const perimeter = 2 * (r.width + r.height)
          for (let d = 0; d < perimeter; d += 5) {
            const angle = d / perimeter * Math.PI * 2
            const x = r.width / 2 + Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** .35 * r.width / 2
            const y = r.height / 2 + Math.sign(Math.sin(angle)) * Math.abs(Math.sin(angle)) ** .35 * r.height / 2
            targets.push({ x: r.left - canvasRect.left + x, y: r.top - canvasRect.top + y, ink: false })
          }
        }
        if (!ink || !el.classList.contains('event-title')) return
        const style = getComputedStyle(el)
        const fontSize = parseFloat(style.fontSize)
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.1
        const scale = Math.min(1, 700 / r.width)
        stamp.width = Math.ceil(r.width * scale); stamp.height = Math.ceil(r.height * scale)
        ink.scale(scale, scale)
        ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        if ('letterSpacing' in ink) ink.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing
        ink.textBaseline = 'top'; ink.fillStyle = '#fff'
        const words = (el.textContent || '').trim().split(/\s+/)
        let line = '', y = 0
        for (const word of words) {
          const next = line ? `${line} ${word}` : word
          if (line && ink.measureText(next).width > r.width) { ink.fillText(line, 0, y); y += lineHeight; line = word }
          else line = next
        }
        ink.fillText(line, 0, y)
        const pixels = ink.getImageData(0, 0, stamp.width, stamp.height).data
        for (let y = 0; y < stamp.height; y += 3) for (let x = 0; x < stamp.width; x += 3) {
          if (pixels[(y * stamp.width + x) * 4 + 3] > 150) targets.push({ x: r.left - canvasRect.left + x / scale, y: r.top - canvasRect.top + y / scale, ink: true })
        }
      })
    }
    function draw(dt: number) {
      const { colors: c, paused, opening, eventView, motion } = live.current
      if (needsMeasure) measure()
      if (!paused) time += dt
      if (opening && !wasOpening) openingStarted = performance.now()
      if (opening && !paused) openingTime = (performance.now() - openingStarted) / 1000
      if (!opening) openingTime = 0
      wasOpening = opening
      const progress = eventView ? 1 : clamp(openingTime / 2.6)
      const charge = Math.sin(clamp(progress / .62) * Math.PI)
      const release = smooth((progress - .4) / .3)
      const spread = smooth((progress - .65) / .35)
      const follow = paused ? 1 : 1 - Math.exp(-dt * 4)
      gx += ((paused ? 0 : clamp(motion.current.x, -1, 1)) - gx) * follow
      gy += ((paused ? 0 : clamp(motion.current.y, -1, 1)) - gy) * follow
      viewMix += ((eventView ? 1 : 0) - viewMix) * (paused ? 1 : 1 - Math.exp(-dt * 7))
      ctx!.clearRect(0, 0, w, h)
      const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2
      const unit = Math.min(bounds.width / 2.25, bounds.height / 2.25)
      const haze = ctx!.createRadialGradient(w * .5, h * .54, 0, w * .5, h * .54, Math.max(w, h) * .65)
      haze.addColorStop(0, c.glow + '22'); haze.addColorStop(.65, c.dust + '10'); haze.addColorStop(1, c.background + '00')
      ctx!.fillStyle = haze; ctx!.fillRect(0, 0, w, h)
      ctx!.globalCompositeOperation = 'lighter'
      const paletteKey = `${c.rim}:${c.accent}:${c.dust}:${tier}`
      if (paletteKey !== clusterPalette) {
        clusters.clear()
        clusterPalette = paletteKey
      }
      const count = sizes[tier]
      for (let i = 0; i < count; i++) {
        const p = grains[i]
        const spring = p.loose ? 2.8 : 24
        if (paused) { p.ox = p.oy = p.vx = p.vy = 0 }
        else {
          p.vx += (gx * (p.loose ? 150 : 5) - p.ox * spring) * dt
          p.vy += (gy * (p.loose ? 150 : 5) - p.oy * spring) * dt
          const drag = Math.exp(-dt * (p.loose ? 2.1 : 7))
          p.vx *= drag; p.vy *= drag
          p.ox = clamp(p.ox + p.vx * dt, -100, 100); p.oy = clamp(p.oy + p.vy * dt, -100, 100)
        }
        const turn = release * (p.shoulder ? .65 : -.35)
        let x = p.x * Math.cos(turn) - p.y * Math.sin(turn)
        let y = p.x * Math.sin(turn) + p.y * Math.cos(turn), z = p.z
        const angle = -.1 + gx * .095 + (paused ? 0 : Math.sin(time * .24) * .025)
        const rotated = x * Math.cos(angle) + z * Math.sin(angle)
        z = -x * Math.sin(angle) + z * Math.cos(angle); x = rotated
        const pitch = .1 + gy * .08 + (paused ? 0 : Math.sin(time * .19) * .015)
        const pitchY = y * Math.cos(pitch) + z * Math.sin(pitch)
        z = -y * Math.sin(pitch) + z * Math.cos(pitch); y = pitchY
        const perspective = 3.6 / (3.6 - z)
        const contraction = 1 - charge * .025
        let px = cx + x * unit * perspective * contraction
        let py = cy + y * unit * perspective * contraction
        const drift = paused ? 0 : Math.sin(time * .5 + p.phase) * (p.loose ? 2.2 : .3)
        px += p.ox + drift; py += p.oy + drift * .6
        const burst = spread * unit * (.55 + (i % 120) / 120)
        px += x * burst; py += y * burst
        const turnedNX = p.nx * Math.cos(turn) - p.ny * Math.sin(turn)
        const turnedNY = p.nx * Math.sin(turn) + p.ny * Math.cos(turn)
        const normalX = turnedNX * Math.cos(angle) + p.nz * Math.sin(angle)
        const yawNZ = -turnedNX * Math.sin(angle) + p.nz * Math.cos(angle)
        const normalY = turnedNY * Math.cos(pitch) + yawNZ * Math.sin(pitch)
        const normalZ = -turnedNY * Math.sin(pitch) + yawNZ * Math.cos(pitch)
        const light = clamp(normalX * -.45 + normalY * -.55 + normalZ * .7)
        const facing = .5 + .5 * clamp(normalZ)
        let opacity = (.28 + light * .55) * facing * (1 - spread * .9)
        const lockColor = light > .86 ? c.rim : light > .18 ? c.accent : c.dust
        let color = lockColor
        if (targets.length) {
          const target = targets[(i * 37) % targets.length]
          const mix = eventView ? viewMix : 0
          px += (target.x + p.ox * .35 - px) * mix
          py += (target.y + p.oy * .35 - py) * mix
          opacity += ((target.ink ? .07 : .2) - opacity) * mix
          if (mix > .5) color = target.ink ? c.title : c.line
        } else opacity *= 1 - viewMix
        const pulse = 1
        ctx!.globalAlpha = clamp(opacity * pulse + charge * .12 * (1 - viewMix), 0, .9)
        ctx!.fillStyle = color
        const size = p.size * clamp(unit / 180, .8, 2)
        const mix = eventView ? viewMix : 0
        const alpha = ctx!.globalAlpha
        const cluster = !p.loose && mix < .99
          ? grainCluster(lockColor, i % 8) : null
        if (cluster) {
          let diameter = size * (10 + (i % 3))
          if (!p.shoulder) {
            const circleGap = Math.hypot(p.x, p.y + .1) - .155
            const stemGap = Math.hypot(Math.max(Math.abs(p.x) - .07, 0),
              Math.max(-.03 - p.y, p.y - .32, 0))
            diameter = Math.min(diameter, Math.max(size, Math.min(circleGap, stemGap) * unit * 1.5))
          }
          ctx!.globalAlpha = alpha * (1 - mix)
          ctx!.drawImage(cluster, px - diameter / 2, py - diameter / 2, diameter, diameter)
        }
        if (p.loose || mix > .01) {
          ctx!.globalAlpha = alpha * (p.loose ? 1 : mix)
          ctx!.fillRect(px, py, size, size)
        }
      }
      if (!eventView && targets.length) {
        ctx!.fillStyle = c.line
        ctx!.globalAlpha = .16
        for (let i = 0; i < 120; i++) {
          const point = targets[(i * 13) % targets.length]
          ctx!.fillRect(point.x + gx * 3, point.y + gy * 3, .7, .7)
        }
      }
      for (let i = 0; i < [100, 200, 380][tier]; i++) {
        const p = air[i], depth = .25 + p.z
        if (!paused) {
          p.x = (p.x + gx * dt * .027 * depth + 1) % 1
          p.y = (p.y + (gy * .027 + .003) * dt * depth + 1) % 1
        }
        const x = p.x * w + Math.sin(time * .14 + p.phase) * 6
        const y = p.y * h
        ctx!.globalAlpha = .05 + p.z * .13
        ctx!.fillStyle = p.z > .8 ? c.rim : c.dust
        ctx!.fillRect(x, y, .5 + p.z, 1 + p.z)
      }
      ctx!.globalAlpha = 1; ctx!.globalCompositeOperation = 'source-over'
    }
    function loop(now: number) {
      frame = 0
      if (document.hidden) return
      if (now - previous >= (live.current.paused ? 160 : 31)) {
        const elapsed = previous ? now - previous : 33
        const start = performance.now()
        draw(Math.min(elapsed / 1000, .055))
        previous = now
        if (!live.current.paused) {
          cost += performance.now() - start
          if (elapsed > 55) late++
          if (++samples >= 90) {
            if ((cost / samples > 14 || late > 25) && tier > 0) { tier--; resize() }
            samples = cost = late = 0
          }
        }
      }
      frame = requestAnimationFrame(loop)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const mutationObserver = new MutationObserver(() => { needsMeasure = true })
    mutationObserver.observe(root, { childList: true, subtree: true, characterData: true })
    const mark = () => { needsMeasure = true }
    const visible = () => { cancelAnimationFrame(frame); previous = 0; if (!document.hidden) { needsMeasure = true; frame = requestAnimationFrame(loop) } }
    window.addEventListener('scroll', mark, { passive: true, capture: true })
    window.addEventListener('resize', mark, { passive: true })
    document.fonts?.addEventListener('loadingdone', mark)
    document.addEventListener('visibilitychange', visible)
    resize(); frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); mutationObserver.disconnect()
      window.removeEventListener('scroll', mark, true)
      window.removeEventListener('resize', mark)
      document.fonts?.removeEventListener('loadingdone', mark)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  return <canvas ref={ref} className="sand-scene" aria-hidden="true" />
}
