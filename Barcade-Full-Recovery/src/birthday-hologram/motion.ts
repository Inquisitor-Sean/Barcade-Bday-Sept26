import { useCallback, useEffect, useRef, useState } from 'react'
export type MotionStatus =
  'off' | 'requesting' | 'waiting' | 'on' | 'denied' | 'unavailable'
export interface MotionVector {
  x: number
  y: number
  energy: number
}
export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))
export const angleDelta = (a: number, b: number) => ((a - b + 540) % 360) - 180

export function usePhoneMotion(paused: boolean) {
  const vector = useRef<MotionVector>({ x: 0, y: 0, energy: 0 })
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<MotionStatus>('off')
  const generation = useRef(0)
  const enabled = useRef(false)
  const pending = useRef(false)
  const pausedRef = useRef(paused)
  const teardown = useRef<() => void>(() => {})
  const reset = useCallback(() => {
    vector.current = { x: 0, y: 0, energy: 0 }
    const style = surfaceRef.current?.style
    style?.setProperty('--motion-x', '0px')
    style?.setProperty('--motion-y', '0px')
  }, [])
  const disable = useCallback(() => {
    generation.current++
    enabled.current = pending.current = false
    teardown.current()
    teardown.current = () => {}
    reset()
    setStatus('off')
  }, [reset])
  useEffect(() => {
    pausedRef.current = paused
    // oxlint-disable-next-line react/set-state-in-effect -- Stopping an external sensor also updates its displayed permission state.
    if (paused) disable()
  }, [paused, disable])
  useEffect(
    () => () => {
      generation.current++
      enabled.current = pending.current = false
      teardown.current()
    },
    [],
  )

  async function enable() {
    if (paused || pending.current || enabled.current) return
    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      setStatus('unavailable')
      return
    }
    const token = ++generation.current
    pending.current = true
    setStatus('requesting')
    try {
      const ctor =
        window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<string>
        }
      const permission =
        typeof ctor.requestPermission === 'function'
          ? await ctor.requestPermission()
          : 'granted'
      if (token !== generation.current || pausedRef.current) return
      pending.current = false
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      enabled.current = true
      setStatus('waiting')
      let baseline: { beta: number; gamma: number } | null = null
      let previous: { beta: number; gamma: number; at: number } | null = null
      let timeout: ReturnType<typeof setTimeout>
      let received = false
      function calibrate() {
        baseline = previous = null
        reset()
      }
      function receive(e: DeviceOrientationEvent) {
        if (
          document.hidden ||
          pausedRef.current ||
          token !== generation.current
        )
          return
        if (
          e.beta === null ||
          e.gamma === null ||
          !Number.isFinite(e.beta) ||
          !Number.isFinite(e.gamma)
        )
          return
        clearTimeout(timeout)
        if (!received) {
          received = true
          setStatus('on')
        }
        baseline ??= { beta: e.beta, gamma: e.gamma }
        let pitch = angleDelta(e.beta, baseline.beta),
          roll = angleDelta(e.gamma, baseline.gamma)
        const angle = window.screen.orientation?.angle ?? 0
        if (angle === 90) [pitch, roll] = [roll, -pitch]
        if (angle === 270 || angle === -90) [pitch, roll] = [-roll, pitch]
        if (angle === 180) {
          pitch = -pitch
          roll = -roll
        }
        vector.current.x = clamp(roll / 28, -1, 1)
        vector.current.y = clamp(pitch / 28, -1, 1)
        const now = performance.now()
        if (previous) {
          const dt = (now - previous.at) / 1000
          if (dt > 0.004 && dt < 0.3) {
            const velocity =
              Math.hypot(
                angleDelta(e.beta, previous.beta),
                angleDelta(e.gamma, previous.gamma),
              ) / dt
            vector.current.energy = Math.max(
              vector.current.energy,
              clamp((velocity - 30) / 230, 0, 1),
            )
          }
        }
        previous = { beta: e.beta, gamma: e.gamma, at: now }
        surfaceRef.current?.style.setProperty(
          '--motion-x',
          `${vector.current.x * 7}px`,
        )
        surfaceRef.current?.style.setProperty(
          '--motion-y',
          `${vector.current.y * 5}px`,
        )
      }
      function cleanup() {
        clearTimeout(timeout)
        window.removeEventListener('deviceorientation', receive)
        document.removeEventListener('visibilitychange', calibrate)
        window.screen.orientation?.removeEventListener('change', calibrate)
      }
      teardown.current = cleanup
      window.addEventListener('deviceorientation', receive, { passive: true })
      document.addEventListener('visibilitychange', calibrate)
      window.screen.orientation?.addEventListener('change', calibrate)
      timeout = setTimeout(() => {
        if (token !== generation.current) return
        cleanup()
        enabled.current = false
        reset()
        setStatus('unavailable')
      }, 5000)
    } catch {
      if (token === generation.current) {
        pending.current = false
        setStatus('denied')
      }
    }
  }
  function movePointer(x: number, y: number) {
    if (pausedRef.current || enabled.current) return
    vector.current.x = clamp(x, -1, 1)
    vector.current.y = clamp(y, -1, 1)
  }
  return { vector, surfaceRef, status, enable, disable, movePointer }
}
