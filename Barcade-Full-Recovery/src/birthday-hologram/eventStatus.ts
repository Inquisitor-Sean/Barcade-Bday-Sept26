import { useEffect, useState } from 'react'
import { publicAsset } from './event'
export type EventStatus = {
  state: 'scheduled' | 'cancelled'
  message: string
  checked: boolean
  error: boolean
}
export function useEventStatus() {
  const [status, setStatus] = useState<EventStatus>({
    state: 'scheduled',
    message: '',
    checked: false,
    error: false,
  })
  useEffect(() => {
    let active = true,
      controller: AbortController | null = null
    async function refresh() {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      const timer = setTimeout(
        () => controller?.signal === signal && controller.abort(),
        7000,
      )
      try {
        const response = await fetch(publicAsset('event-status.json'), {
          cache: 'no-store',
          signal,
        })
        if (!response.ok) throw new Error('Status unavailable')
        const data = await response.json()
        if (!['scheduled', 'cancelled'].includes(data.state))
          throw new Error('Invalid status')
        if (active && controller?.signal === signal)
          setStatus({
            state: data.state,
            message: typeof data.message === 'string' ? data.message : '',
            checked: true,
            error: false,
          })
      } catch {
        if (active && controller?.signal === signal)
          setStatus((old) => ({ ...old, checked: true, error: true }))
      } finally {
        clearTimeout(timer)
      }
    }
    void refresh()
    const tick = setInterval(() => void refresh(), 60000)
    const focus = () => void refresh()
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', focus)
    return () => {
      active = false
      controller?.abort()
      clearInterval(tick)
      window.removeEventListener('focus', focus)
      document.removeEventListener('visibilitychange', focus)
    }
  }, [])
  return status
}
