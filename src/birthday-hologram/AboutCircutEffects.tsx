import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function CircuitArtwork() {
  return (
    <div className="about-circuit-art" aria-hidden="true">
      <svg
        viewBox="0 0 420 250"
        preserveAspectRatio="none"
        focusable="false"
      >
        <g className="about-circuit-traces">
          <path d="M12 52H78V92H144V52H204V116H284V78H408" />
          <path d="M24 214H96V170H164V212H236V152H326V190H404" />
          <path d="M34 132H112V118H184V140H252V104H332V132H390" />
        </g>

        <g className="about-circuit-current">
          <path d="M12 52H78V92H144V52H204V116H284V78H408" />
          <path d="M24 214H96V170H164V212H236V152H326V190H404" />
        </g>

        <g className="about-circuit-nodes">
          <circle cx="78" cy="92" r="3" />
          <circle cx="144" cy="52" r="3" />
          <circle cx="204" cy="116" r="3" />
          <circle cx="284" cy="78" r="3" />
          <circle cx="96" cy="170" r="3" />
          <circle cx="164" cy="212" r="3" />
          <circle cx="236" cy="152" r="3" />
          <circle cx="326" cy="190" r="3" />
        </g>
      </svg>

      <span className="about-circuit-scan" />
      <span className="about-circuit-tear" />
    </div>
  )
}

const selector = '.game-tile, .game-stats, .game-inventory > div'

export default function AboutCircuitEffects() {
  const anchor = useRef<HTMLSpanElement>(null)
  const [targets, setTargets] = useState<HTMLElement[]>([])

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>('.game-about')
    if (!root) return

    function collect() {
      if (!root) return

      const next = Array.from(
        root.querySelectorAll<HTMLElement>(selector),
      )

      setTargets(previous =>
        previous.length === next.length &&
        previous.every((element, index) => element === next[index])
          ? previous
          : next,
      )
    }

    collect()

    const observer = new MutationObserver(collect)
    observer.observe(root, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>('.game-about')
    const experience = root?.closest<HTMLElement>('.experience')

    if (!root || !experience) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timers = new Map<HTMLElement, number>()

    let lastTear = -Infinity
    let lastSample = 0
    let index = 0

    const readMotion = () => ({
      x: Number.parseFloat(
        experience.style.getPropertyValue('--motion-x'),
      ) || 0,
      y: Number.parseFloat(
        experience.style.getPropertyValue('--motion-y'),
      ) || 0,
    })

    let previous = readMotion()

    const paused = () =>
      document.hidden ||
      media.matches ||
      experience.classList.contains('reduced-motion') ||
      experience.classList.contains('high-contrast')

    function clearEffects() {
      timers.forEach(timer => window.clearTimeout(timer))
      timers.clear()

      targets.forEach(tile => {
        tile.classList.remove('circuit-tearing')
        tile.style.removeProperty('--circuit-shift')
      })

      previous = readMotion()
    }

    function tear(tile: HTMLElement, direction: number) {
      if (paused()) return

      const now = performance.now()
      if (now - lastTear < 900) return
      lastTear = now

      tile.style.setProperty(
        '--circuit-shift',
        direction < 0 ? '-7px' : '7px',
      )
      tile.classList.add('circuit-tearing')

      timers.set(
        tile,
        window.setTimeout(() => {
          tile.classList.remove('circuit-tearing')
          tile.style.removeProperty('--circuit-shift')
          timers.delete(tile)
        }, 240),
      )
    }

    function pointer(event: PointerEvent) {
      if (!(event.target instanceof Element)) return

      const tile = event.target.closest<HTMLElement>(selector)
      if (!tile || !root?.contains(tile)) return

      const box = tile.getBoundingClientRect()
      tear(tile, event.clientX - box.left - box.width / 2)
    }

    function motionChanged() {
      if (paused()) {
        clearEffects()
        return
      }

      const now = performance.now()
      if (now - lastSample < 80) return
      lastSample = now

      const current = readMotion()
      const dx = current.x - previous.x
      const dy = current.y - previous.y
      previous = current

      // The motion hook resets both values when motion is disabled.
      if (current.x === 0 && current.y === 0) return
      if (Math.hypot(dx, dy) < 0.4) return
      if (now - lastTear < 900) return

      const visible = targets.filter(tile => {
        const box = tile.getBoundingClientRect()
        return (
          box.bottom > 0 &&
          box.top < window.innerHeight &&
          box.right > 0 &&
          box.left < window.innerWidth
        )
      })

      if (visible.length) {
        tear(visible[index++ % visible.length], dx || dy)
      }
    }

    const observer = new MutationObserver(motionChanged)
    observer.observe(experience, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    root.addEventListener('pointerdown', pointer)
    media.addEventListener('change', clearEffects)
    document.addEventListener('visibilitychange', clearEffects)

    return () => {
      observer.disconnect()
      root.removeEventListener('pointerdown', pointer)
      media.removeEventListener('change', clearEffects)
      document.removeEventListener('visibilitychange', clearEffects)
      clearEffects()
    }
  }, [targets])

  return (
    <>
      <span ref={anchor} hidden />

      {targets.map((target, index) =>
        createPortal(
          <CircuitArtwork />,
          target,
          `about-circuit-${index}`,
        ),
      )}
    </>
  )
}