// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { angleDelta, usePhoneMotion } from './motion'

function reading(beta: number | null, gamma: number | null) {
  const e = new Event('deviceorientation')
  Object.defineProperties(e, { beta: { value: beta }, gamma: { value: gamma } })
  act(() => window.dispatchEvent(e))
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('isSecureContext', true)
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('phone motion consent and lifecycle', () => {
  it('asks only on enable, waits for a reading, and removes movement on disable', async () => {
    const permission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('DeviceOrientationEvent', { requestPermission: permission })
    const { result } = renderHook(() => usePhoneMotion(false))
    expect(permission).not.toHaveBeenCalled()
    expect(result.current.status).toBe('off')
    await act(() => result.current.enable())
    expect(permission).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('waiting')
    reading(null, null)
    expect(result.current.status).toBe('waiting')
    reading(60, 0)
    reading(74, 14)
    expect(result.current.status).toBe('on')
    expect(result.current.vector.current.x).toBeCloseTo(0.5)
    expect(result.current.vector.current.y).toBeCloseTo(0.5)
    act(() => result.current.disable())
    reading(90, 28)
    expect(result.current.status).toBe('off')
    expect(result.current.vector.current).toEqual({ x: 0, y: 0, energy: 0 })
  })
  it('supports the Android path and reports unavailable without real readings', async () => {
    vi.stubGlobal('DeviceOrientationEvent', {})
    const { result } = renderHook(() => usePhoneMotion(false))
    await act(() => result.current.enable())
    expect(result.current.status).toBe('waiting')
    act(() => vi.advanceTimersByTime(5001))
    expect(result.current.status).toBe('unavailable')
    reading(60, 0)
    expect(result.current.status).toBe('unavailable')
  })
  it('ignores a permission response that arrives after reduced motion is selected', async () => {
    let grant!: (permission: string) => void
    vi.stubGlobal('DeviceOrientationEvent', {
      requestPermission: () =>
        new Promise<string>((resolve) => {
          grant = resolve
        }),
    })
    const { result, rerender } = renderHook(
      ({ paused }) => usePhoneMotion(paused),
      { initialProps: { paused: false } },
    )
    let request!: Promise<void>
    act(() => {
      request = result.current.enable()
    })
    rerender({ paused: true })
    await act(async () => {
      grant('granted')
      await request
    })
    reading(30, 30)
    expect(result.current.status).toBe('off')
    expect(result.current.vector.current.x).toBe(0)
  })
  it('honours denied permission and stops sensors on unmount', async () => {
    vi.stubGlobal('DeviceOrientationEvent', {
      requestPermission: () => Promise.resolve('denied'),
    })
    const { result, unmount } = renderHook(() => usePhoneMotion(false))
    await act(() => result.current.enable())
    expect(result.current.status).toBe('denied')
    vi.stubGlobal('DeviceOrientationEvent', {})
    await act(() => result.current.enable())
    reading(40, 0)
    const vector = result.current.vector
    unmount()
    reading(40, 28)
    expect(vector.current.x).toBe(0)
  })
  it('uses the short distance when an angle crosses the 180 degree boundary', () => {
    expect(angleDelta(-179, 179)).toBe(2)
    expect(angleDelta(179, -179)).toBe(-2)
  })
})
