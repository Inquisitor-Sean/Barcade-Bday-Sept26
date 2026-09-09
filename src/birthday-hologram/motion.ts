import { useCallback, useEffect, useRef, useState } from 'react'

export type MotionStatus =
  | 'off'
  | 'requesting'
  | 'on'
  | 'denied'
  | 'unavailable'

type OrientationPermission = {
  requestPermission?: () => Promise<string>
}

export function usePhoneMotion(paused: boolean) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<MotionStatus>('off')
  const generation = useRef(0)
  const busy = useRef(false)
  const alive = useRef(false)
  const stop = useRef<() => void>(() => { })

  useEffect(() => {
    alive.current = true

    return () => {
      alive.current = false
      generation.current += 1
      busy.current = false
      stop.current()
    }
  }, [])

  const disable = useCallback(() => {
    generation.current += 1
    busy.current = false
    stop.current()
    stop.current = () => { }
    setStatus('off')
  }, [])

  useEffect(() => {
    if (paused) disable()
  }, [paused, disable])

  async function enable() {
    if (paused || busy.current || status === 'on') return

    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      setStatus('unavailable')
      return
    }

    busy.current = true
    const token = ++generation.current
    setStatus('requesting')

    try {
      const sensor =
        window.DeviceOrientationEvent as unknown as OrientationPermission

      const permission = sensor.requestPermission
        ? await sensor.requestPermission()
        : 'granted'

      if (!alive.current || token !== generation.current) return

      busy.current = false

      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const surface = surfaceRef.current

      if (!surface) {
        setStatus('unavailable')
        return
      }

      let previous: { beta: number; gamma: number; time: number } | null = null
      let baseline: { beta: number; gamma: number } | null = null
      let frame = 0
      let tear = 0
      let lastFrame = 0
      let timeout = 0

      const difference = (a: number, b: number) =>
        ((a - b + 540) % 360) - 180

      const clamp = (value: number, limit: number) =>
        Math.max(-limit, Math.min(limit, value))

      function reset() {
        cancelAnimationFrame(frame)
        frame = 0
        tear = 0
        lastFrame = 0
        previous = null
        baseline = null
        surface!.style.setProperty('--tilt-x', '0deg')
        surface!.style.setProperty('--tilt-y', '0deg')
        surface!.style.setProperty('--tear', '0')
        surface!.style.setProperty('--tear-shift', '0px')
      }

      function decay(now: number) {
        frame = 0
        const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, .1) : .016
        lastFrame = now
        tear *= Math.exp(-elapsed * 9)

        if (tear < .003) tear = 0

        surface!.style.setProperty('--tear', String(tear))
        surface!.style.setProperty('--tear-shift', `${tear * 14}px`)

        if (tear > 0) frame = requestAnimationFrame(decay)
      }

      function receive(event: DeviceOrientationEvent) {
        if (document.hidden || event.beta === null || event.gamma === null) return
        if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return

        clearTimeout(timeout)

        const now = performance.now()
        baseline ??= { beta: event.beta, gamma: event.gamma }

        let pitch = difference(event.beta, baseline.beta)
        let roll = difference(event.gamma, baseline.gamma)
        const angle = window.screen.orientation?.angle ?? 0

        if (angle === 90) [pitch, roll] = [roll, -pitch]
        if (angle === 270) [pitch, roll] = [-roll, pitch]
        if (angle === 180) {
          pitch = -pitch
          roll = -roll
        }

        surface!.style.setProperty('--tilt-x', `${clamp(-pitch / 7, 4)}deg`)
        surface!.style.setProperty('--tilt-y', `${clamp(roll / 7, 4)}deg`)

        if (previous) {
          const dt = (now - previous.time) / 1000

          if (dt > .004 && dt < .3) {
            const speed = Math.hypot(
              difference(event.beta, previous.beta),
              difference(event.gamma, previous.gamma),
            ) / dt

            tear = Math.max(tear, Math.min(1, Math.max(0, (speed - 35) / 220)))

            if (tear > 0 && !frame) {
              lastFrame = now
              frame = requestAnimationFrame(decay)
            }
          }
        }

        previous = { beta: event.beta, gamma: event.gamma, time: now }
      }

      function cleanup() {
        clearTimeout(timeout)
        window.removeEventListener('deviceorientation', receive)
        document.removeEventListener('visibilitychange', reset)
        window.screen.orientation?.removeEventListener('change', reset)
        reset()
      }

      stop.current = cleanup
      window.addEventListener('deviceorientation', receive, { passive: true })
      document.addEventListener('visibilitychange', reset)
      window.screen.orientation?.addEventListener('change', reset)

      timeout = window.setTimeout(() => {
        cleanup()
        if (alive.current && token === generation.current) {
          setStatus('unavailable')
        }
      }, 3000)

      setStatus('on')
    } catch {
      busy.current = false
      if (alive.current && token === generation.current) {
        setStatus('denied')
      }
    }
  }

  return { surfaceRef, status, enable, disable }
}