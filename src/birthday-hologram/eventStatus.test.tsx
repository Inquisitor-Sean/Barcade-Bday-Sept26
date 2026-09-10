// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useEventStatus } from './eventStatus'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it('refreshes on focus and retains a known cancellation through a network failure', async () => {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  })
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'scheduled', message: '' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'cancelled', message: 'Plans changed.' }),
    })
    .mockRejectedValueOnce(new Error('Offline'))
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(useEventStatus)
  await waitFor(() => expect(result.current.checked).toBe(true))
  expect(fetcher.mock.calls[0][1].cache).toBe('no-store')
  act(() => window.dispatchEvent(new Event('focus')))
  await waitFor(() => expect(result.current.state).toBe('cancelled'))
  act(() => window.dispatchEvent(new Event('focus')))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.state).toBe('cancelled')
  expect(result.current.message).toBe('Plans changed.')
})
