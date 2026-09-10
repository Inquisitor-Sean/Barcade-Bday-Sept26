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

interface Target {
  x: number
  y: number
  ink: boolean
}

interface Grain {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  shoulder: boolean
  clearance: number
  loose: boolean
  phase: number
  size: number
  variant: number
  ox: number
  oy: number
  vx: number
  vy: number
}

const TAU = Math.PI * 2
const OPEN_SECONDS = 2.6

const COUNTS = [1700, 3100, 5000]
const CLUSTER_COUNTS = [10, 16, 24]
const AIR_COUNTS = [100, 200, 380]
const PIXEL_BUDGETS = [650000, 1400000, 2400000]

const clamp = (n: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, n))

const smooth = (n: number) => {
  const x = clamp(n)
  return x * x * (3 - 2 * x)
}

export default function SandHologram(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const live = useRef(props)

  useEffect(() => {
    live.current = props
  }, [props])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const rootElement = canvas.parentElement
    if (!context || !rootElement) return

    const ctx = context
    const root = rootElement

    let frame = 0
    let previous = 0
    let time = 0
    let startupTime = 0
    let width = 1
    let height = 1
    let tier = window.innerWidth < 700 ? 1 : 2

    let samples = 0
    let totalCost = 0
    let lateFrames = 0

    let gravityX = 0
    let gravityY = 0
    let eventMix = props.eventView ? 1 : 0
    let openingStarted = 0
    let wasOpening = false

    let needsMeasure = true
    let wasPaused = props.paused
    let disposed = false

    let bounds = { x: 0, y: 0, width: 1, height: 1 }
    let targets: Target[] = []
    let paletteKey = ''
    let stamps: HTMLCanvasElement[][] = []

    let seed = 9737

    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }

    function makeGrain(index: number): Grain {
      const shoulder = index % 10 < 6

      let x = 0
      let y = 0
      let z = 0
      let nx = 0
      let ny = 0
      let nz = 1
      let clearance = Infinity

      if (shoulder) {
        const around = random() * TAU
        const cross = random() * TAU
        const tube = 0.255 * (0.86 + random() * 0.14)
        const radius = 0.735 + tube * Math.cos(cross)

        x = radius * Math.cos(around)
        y = radius * Math.sin(around)
        z = tube * Math.sin(cross)

        nx = Math.cos(around) * Math.cos(cross)
        ny = Math.sin(around) * Math.cos(cross)
        nz = Math.sin(cross)
      } else {
        do {
          const angle = random() * TAU
          const radius = Math.sqrt(random()) * 0.65

          x = Math.cos(angle) * radius
          y = Math.sin(angle) * radius
        } while (
          Math.hypot(x, y + 0.1) < 0.155 ||
          (Math.abs(x) < 0.07 && y > -0.03 && y < 0.32)
        )

        z =
          0.08 +
          0.085 * (1 - (x * x + y * y) / 0.43) +
          (random() - 0.5) * 0.07

        nx = x * 0.4
        ny = y * 0.4
        nz = Math.sqrt(1 - nx * nx - ny * ny)

        const circleGap = Math.hypot(x, y + 0.1) - 0.155
        const stemGap = Math.hypot(
          Math.max(Math.abs(x) - 0.07, 0),
          Math.max(-0.03 - y, y - 0.32, 0),
        )

        clearance = Math.max(0, Math.min(circleGap, stemGap))
      }

      return {
        x,
        y,
        z,
        nx,
        ny,
        nz,
        shoulder,
        clearance,
        loose: random() < 0.23,
        phase: random() * TAU,
        size: 0.65 + random() * 0.7,
        variant: index % 8,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
      }
    }

    const grains: Grain[] = []

    const air = Array.from({ length: 380 }, () => ({
      x: random(),
      y: random(),
      depth: random(),
      phase: random() * TAU,
    }))

    function buildStamps(colors: string[]) {
      return colors.map(color =>
        Array.from({ length: 8 }, (_, variant) => {
          const stamp = document.createElement('canvas')
          stamp.width = stamp.height = 48

          const ink = stamp.getContext('2d')
          if (!ink) return stamp

          let state = 719 + variant * 103

          function noise() {
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0
            return state / 4294967296
          }

          ink.fillStyle = color

          for (let n = 0; n < CLUSTER_COUNTS[tier]; n++) {
            const angle = noise() * TAU
            const radius = n === 0 ? 0 : Math.sqrt(noise()) * 18
            const size = 2.2 + noise() * 2.8

            ink.globalAlpha = 0.65 + noise() * 0.35

            ink.fillRect(
              24 + Math.cos(angle) * radius - size / 2,
              24 + Math.sin(angle) * radius - size / 2,
              size,
              size * (0.75 + noise() * 0.4),
            )
          }

          return stamp
        }),
      )
    }

    function resize() {
      width = Math.max(1, canvas!.clientWidth)
      height = Math.max(1, canvas!.clientHeight)

      const ratio = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(PIXEL_BUDGETS[tier] / (width * height)),
      )

      canvas!.width = Math.max(1, Math.round(width * ratio))
      canvas!.height = Math.max(1, Math.round(height * ratio))
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      needsMeasure = true
    }

    function measure() {
      needsMeasure = false

      const canvasRect = canvas!.getBoundingClientRect()
      const lock = root
        .querySelector('.lock-trigger')
        ?.getBoundingClientRect()

      if (lock) {
        bounds = {
          x: lock.left - canvasRect.left,
          y: lock.top - canvasRect.top,
          width: lock.width,
          height: lock.height,
        }
      }

      targets = []

      if (!live.current.eventView) return

      const textCanvas = document.createElement('canvas')
      const ink = textCanvas.getContext('2d')

      root
        .querySelectorAll<HTMLElement>(
          '.event-title, .event-information, ' +
            '.event-actions button, .event-actions a, .event-links button',
        )
        .forEach(element => {
          const rect = element.getBoundingClientRect()
          if (!rect.width || !rect.height) return

          const left = rect.left - canvasRect.left
          const top = rect.top - canvasRect.top
          const isTitle = element.classList.contains('event-title')

          if (!isTitle) {
            const perimeter = 2 * (rect.width + rect.height)

            for (let d = 0; d < perimeter; d += 6) {
              const angle = (d / perimeter) * TAU
              const cos = Math.cos(angle)
              const sin = Math.sin(angle)

              targets.push({
                x:
                  left +
                  rect.width / 2 +
                  Math.sign(cos) *
                    Math.abs(cos) ** 0.35 *
                    rect.width / 2,
                y:
                  top +
                  rect.height / 2 +
                  Math.sign(sin) *
                    Math.abs(sin) ** 0.35 *
                    rect.height / 2,
                ink: false,
              })
            }

            return
          }

          if (!ink) return

          const style = getComputedStyle(element)
          const fontSize = parseFloat(style.fontSize)
          const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.1
          const scale = Math.min(1, 700 / rect.width)

          textCanvas.width = Math.max(1, Math.ceil(rect.width * scale))
          textCanvas.height = Math.max(1, Math.ceil(rect.height * scale))

          ink.scale(scale, scale)
          ink.font =
            `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

          if ('letterSpacing' in ink) {
            ink.letterSpacing =
              style.letterSpacing === 'normal'
                ? '0px'
                : style.letterSpacing
          }

          ink.fillStyle = '#fff'
          ink.textBaseline = 'top'

          const words = (element.textContent || '').trim().split(/\s+/)
          let line = ''
          let lineY = 0

          for (const word of words) {
            const next = line ? `${line} ${word}` : word

            if (line && ink.measureText(next).width > rect.width) {
              ink.fillText(line, 0, lineY)
              lineY += lineHeight
              line = word
            } else {
              line = next
            }
          }

          ink.fillText(line, 0, lineY)

          const pixels = ink.getImageData(
            0,
            0,
            textCanvas.width,
            textCanvas.height,
          ).data

          for (let y = 0; y < textCanvas.height; y += 3) {
            for (let x = 0; x < textCanvas.width; x += 3) {
              if (pixels[(y * textCanvas.width + x) * 4 + 3] > 150) {
                targets.push({
                  x: left + x / scale,
                  y: top + y / scale,
                  ink: true,
                })
              }
            }
          }
        })
    }

    function draw(dt: number, now: number) {
      const { colors, paused, opening, eventView, motion } = live.current

      if (needsMeasure) measure()

      if (!paused) {
        time += dt
        startupTime += dt
      }

      if (opening && !wasOpening) openingStarted = now
      wasOpening = opening

      const elapsed = opening ? (now - openingStarted) / 1000 : 0
      const progress = eventView ? 1 : clamp(elapsed / OPEN_SECONDS)
      const charge = paused ? 0 : Math.sin(clamp(progress / 0.62) * Math.PI)
      const release = smooth((progress - 0.4) / 0.3)
      const spread = smooth((progress - 0.65) / 0.35)

      const startup = paused ? 1 : smooth(startupTime / 1.2)
      const ambientStartup = paused
        ? 1
        : smooth((startupTime - 0.65) / 1.2)

      const desiredCount = Math.round(
        COUNTS[tier] * (0.2 + startup * 0.8),
      )

      const allocationLimit = paused
        ? desiredCount
        : Math.min(desiredCount, grains.length + 450)

      while (grains.length < allocationLimit) {
        grains.push(makeGrain(grains.length))
      }

      const count = Math.min(desiredCount, grains.length)
      const idleStrength = (1 - spread) * (eventView ? 0.15 : 1)

      const idleX = paused
        ? 0
        : (
            Math.sin(time * 0.42) * 0.12 +
            Math.sin(time * 0.17 + 1.8) * 0.05
          ) * idleStrength

      const idleY = paused
        ? 0
        : (
            Math.cos(time * 0.31) * 0.09 +
            Math.sin(time * 0.21) * 0.04
          ) * idleStrength

      const targetX = paused
        ? 0
        : clamp(motion.current.x + idleX, -1, 1)

      const targetY = paused
        ? 0
        : clamp(motion.current.y + idleY, -1, 1)

      const follow = paused ? 1 : 1 - Math.exp(-dt * 4)

      gravityX += (targetX - gravityX) * follow
      gravityY += (targetY - gravityY) * follow

      eventMix +=
        ((eventView ? 1 : 0) - eventMix) *
        (paused ? 1 : 1 - Math.exp(-dt * 7))

      const mix = eventView ? eventMix : 0
      const lockVisibility = 1 - mix

      const nextKey =
        `${colors.dust}:${colors.accent}:${colors.rim}:${tier}`

      if (lockVisibility > 0.01 && paletteKey !== nextKey) {
        stamps = buildStamps([colors.dust, colors.accent, colors.rim])
        paletteKey = nextKey
      }

      if (eventView && mix > 0.995 && stamps.length) {
        stamps = []
        paletteKey = ''
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      const unit = Math.min(bounds.width, bounds.height) / 2.25

      const floatY = paused
        ? 0
        : Math.sin(time * 0.52) * Math.min(8, unit * 0.035)

      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2 + floatY

      const yaw =
        -0.1 +
        gravityX * 0.15 +
        (paused ? 0 : Math.sin(time * 0.32) * 0.055)

      const pitch =
        0.1 +
        gravityY * 0.12 +
        (paused ? 0 : Math.cos(time * 0.27) * 0.035)

      const cosYaw = Math.cos(yaw)
      const sinYaw = Math.sin(yaw)
      const cosPitch = Math.cos(pitch)
      const sinPitch = Math.sin(pitch)

      const breathing = paused ? 1 : 1 + Math.sin(time * 0.65) * 0.012
      const scale = breathing * (1 - charge * 0.025)

      const idleTurn = paused ? 0 : Math.sin(time * 0.24) * 0.045
      const rimTurn = release * 0.65 + idleTurn
      const bodyTurn = release * -0.35 - idleTurn * 0.35

      const rimCos = Math.cos(rimTurn)
      const rimSin = Math.sin(rimTurn)
      const bodyCos = Math.cos(bodyTurn)
      const bodySin = Math.sin(bodyTurn)

      for (let i = 0; i < count; i++) {
        const grain = grains[i]

        if (paused) {
          grain.ox = grain.oy = grain.vx = grain.vy = 0
        } else {
          const spring = grain.loose ? 2.8 : 24
          const force = grain.loose ? 150 : 5
          const drag = Math.exp(-dt * (grain.loose ? 2.1 : 7))

          const eddyX = grain.loose
            ? Math.cos(time * 0.8 + grain.phase) * 7
            : 0

          const eddyY = grain.loose
            ? Math.sin(time * 0.65 + grain.phase) * 6
            : 0

          grain.vx +=
            (gravityX * force + eddyX - grain.ox * spring) * dt

          grain.vy +=
            (gravityY * force + eddyY - grain.oy * spring) * dt

          grain.vx *= drag
          grain.vy *= drag

          grain.ox = clamp(grain.ox + grain.vx * dt, -100, 100)
          grain.oy = clamp(grain.oy + grain.vy * dt, -100, 100)
        }

        const cosTurn = grain.shoulder ? rimCos : bodyCos
        const sinTurn = grain.shoulder ? rimSin : bodySin

        const localX = grain.x * cosTurn - grain.y * sinTurn
        const localY = grain.x * sinTurn + grain.y * cosTurn

        const x = localX * cosYaw + grain.z * sinYaw
        const yawZ = -localX * sinYaw + grain.z * cosYaw
        const y = localY * cosPitch + yawZ * sinPitch
        const z = -localY * sinPitch + yawZ * cosPitch

        const perspective = 3.6 / (3.6 - z)

        let px = centerX + x * unit * perspective * scale + grain.ox
        let py = centerY + y * unit * perspective * scale + grain.oy

        const burst = spread * unit * (0.55 + (i % 120) / 120)
        px += x * burst
        py += y * burst

        const turnedNX = grain.nx * cosTurn - grain.ny * sinTurn
        const turnedNY = grain.nx * sinTurn + grain.ny * cosTurn

        const normalX = turnedNX * cosYaw + grain.nz * sinYaw
        const yawNZ = -turnedNX * sinYaw + grain.nz * cosYaw
        const normalY = turnedNY * cosPitch + yawNZ * sinPitch
        const normalZ = -turnedNY * sinPitch + yawNZ * cosPitch

        const light = clamp(
          normalX * -0.45 + normalY * -0.55 + normalZ * 0.7,
        )

        const facing = 0.5 + 0.5 * clamp(normalZ)
        const shade = light > 0.86 ? 2 : light > 0.18 ? 1 : 0

        let color =
          shade === 2
            ? colors.rim
            : shade === 1
              ? colors.accent
              : colors.dust

        let opacity =
          (0.28 + light * 0.55) *
          facing *
          (1 - spread * 0.9)

        if (eventView && targets.length) {
          const target = targets[(i * 37) % targets.length]

          px += (target.x + grain.ox * 0.2 - px) * mix
          py += (target.y + grain.oy * 0.2 - py) * mix

          opacity += ((target.ink ? 0.06 : 0.16) - opacity) * mix

          if (mix > 0.5) {
            color = target.ink ? colors.title : colors.line
          }
        } else if (eventView) {
          opacity *= lockVisibility
        }

        const alpha = clamp(
          opacity + charge * 0.12 * lockVisibility,
          0,
          0.9,
        )

        const size = grain.size * clamp(unit / 180, 0.8, 2)

        if (!grain.loose && lockVisibility > 0.01 && stamps.length) {
          let diameter = size * (10 + (i % 3))

          if (!grain.shoulder) {
            diameter = Math.min(
              diameter,
              Math.max(
                size,
                grain.clearance * unit * perspective * scale * 1.5,
              ),
            )
          }

          ctx.globalAlpha = alpha * lockVisibility

          ctx.drawImage(
            stamps[shade][grain.variant],
            px - diameter / 2,
            py - diameter / 2,
            diameter,
            diameter,
          )
        }

        if (grain.loose || mix > 0.01) {
          ctx.globalAlpha = alpha * (grain.loose ? 1 : mix)
          ctx.fillStyle = color
          ctx.fillRect(px, py, size, size)
        }
      }

      const ambientCount = Math.round(
        AIR_COUNTS[tier] * ambientStartup,
      )

      for (let i = 0; i < ambientCount; i++) {
        const grain = air[i]
        const depth = 0.25 + grain.depth

        if (!paused) {
          const breeze = Math.sin(time * 0.2 + grain.phase) * 0.004

          grain.x =
            (
              grain.x +
              (gravityX * 0.027 + breeze) * dt * depth +
              1
            ) % 1

          grain.y =
            (
              grain.y +
              (gravityY * 0.027 + 0.007) * dt * depth +
              1
            ) % 1
        }

        ctx.globalAlpha = 0.06 + grain.depth * 0.14
        ctx.fillStyle = grain.depth > 0.8 ? colors.rim : colors.dust

        ctx.fillRect(
          grain.x * width,
          grain.y * height,
          0.6 + grain.depth,
          1 + grain.depth,
        )
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    function schedule() {
      if (!disposed && !document.hidden && !frame) {
        frame = requestAnimationFrame(loop)
      }
    }

    function loop(now: number) {
      frame = 0
      if (disposed || document.hidden) return

      const paused = live.current.paused
      const pauseChanged = paused !== wasPaused

      if (pauseChanged) {
        wasPaused = paused
        previous = 0
      }

      const interval = paused ? 160 : 31

      if (!previous || now - previous >= interval || pauseChanged) {
        const elapsed = previous ? now - previous : 33
        const started = performance.now()

        draw(Math.min(elapsed / 1000, 0.055), now)
        previous = now

        if (!paused && startupTime > 2) {
          totalCost += performance.now() - started
          if (elapsed > 55) lateFrames++

          if (++samples >= 90) {
            if (
              (totalCost / samples > 14 || lateFrames > 25) &&
              tier > 0
            ) {
              tier--
              grains.length = Math.min(grains.length, COUNTS[tier])
              resize()
            }

            samples = 0
            totalCost = 0
            lateFrames = 0
          }
        }
      }

      schedule()
    }

    function mark() {
      needsMeasure = true
      schedule()
    }

    function visibilityChanged() {
      cancelAnimationFrame(frame)
      frame = 0
      previous = 0

      if (!document.hidden) {
        needsMeasure = true
        schedule()
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      schedule()
    })

    resizeObserver.observe(canvas)

    const mutationObserver = new MutationObserver(mark)
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    window.addEventListener('resize', mark, { passive: true })
    window.addEventListener('scroll', mark, {
      passive: true,
      capture: true,
    })

    document.fonts?.addEventListener('loadingdone', mark)
    document.addEventListener('visibilitychange', visibilityChanged)

    resize()

    frame = requestAnimationFrame(() => {
      frame = 0
      schedule()
    })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()

      window.removeEventListener('resize', mark)
      window.removeEventListener('scroll', mark, true)
      document.fonts?.removeEventListener('loadingdone', mark)
      document.removeEventListener(
        'visibilitychange',
        visibilityChanged,
      )

      stamps = []
      targets = []
      grains.length = 0
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="sand-scene"
      aria-hidden="true"
    />
  )
}