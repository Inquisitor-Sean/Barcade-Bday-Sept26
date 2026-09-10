import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { event } from './event'

type Guest = { name: string; handle: string }
const validHandle = (handle: unknown): handle is string =>
  typeof handle === 'string' && /^[A-Za-z0-9._]{1,30}$/.test(handle)

export default function Community() {
  const { t } = useTranslation()
  const [guests, setGuests] = useState<Guest[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [refresh, setRefresh] = useState(0)
  const endpoint = event.communityEndpoint
  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        const response = await fetch(endpoint, { signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Unavailable')
        const data = await response.json()
        if (!Array.isArray(data.guests)) throw new Error('Invalid list')
        setGuests(
          data.guests
            .filter(
              (g: Guest) =>
                g && typeof g.name === 'string' && validHandle(g.handle),
            )
            .slice(0, 500),
        )
        setState('ready')
      } catch {
        if (!signal.aborted) setState('error')
      }
    },
    [endpoint],
  )
  useEffect(() => {
    if (!endpoint) return
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      setState('error')
    }, 12000)
    // oxlint-disable-next-line react/set-state-in-effect -- The asynchronous fetch synchronizes the shared guest list.
    void load(controller.signal).finally(() => clearTimeout(timeout))
    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [endpoint, load, refresh])

  return (
    <section className="community-section">
      <h3>{t('handles')}</h3>
      <p>{endpoint ? t('handlesHint') : t('communityPending')}</p>
      <div className="host-links">
        <a
          className="inline-link"
          href={event.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          @sean_allan_ ↗
        </a>
        <a
          className="inline-link"
          href={event.twitchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitch / inquisitor_sean ↗
        </a>
      </div>
      <p className="muted">{t('hobby')}</p>
      {endpoint && (
        <>
          <form
            className="guest-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (sending) return
              const form = e.currentTarget
              const data = new FormData(form)
              const name = String(data.get('name') || '').trim()
              const handle = String(data.get('handle') || '')
                .trim()
                .replace(/^@/, '')
              if (!name || !validHandle(handle) || data.get('consent') !== 'on')
                return
              setSending(true)
              setFeedback('')
              const controller = new AbortController()
              const timeout = setTimeout(() => controller.abort(), 15000)
              try {
                // text/plain avoids a preflight when used with the optional Apps Script adapter.
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({ name, handle, consent: true }),
                  signal: controller.signal,
                })
                if (!response.ok || (await response.json()).ok !== true)
                  throw new Error('Submission not confirmed')
                setFeedback('submitted')
                form.reset()
                setState('loading')
                setRefresh((v) => v + 1)
              } catch {
                setFeedback('submitFailed')
              } finally {
                clearTimeout(timeout)
                setSending(false)
              }
            }}
          >
            <label>
              {t('displayName')}
              <input
                name="name"
                required
                maxLength={60}
                autoComplete="given-name"
              />
            </label>
            <label>
              {t('handle')}
              <input
                name="handle"
                required
                maxLength={31}
                pattern="@?[A-Za-z0-9._]{1,30}"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="@username"
              />
            </label>
            <label className="check-control">
              <input name="consent" type="checkbox" required />
              {t('consent')}
            </label>
            <button type="submit" className="pill-button" disabled={sending}>
              {t(sending ? 'busy' : 'submit')}
            </button>
            <p role="status">{feedback && t(feedback)}</p>
          </form>
          <button
            type="button"
            className="text-button"
            disabled={state === 'loading'}
            onClick={() => {
              setState('loading')
              setRefresh((v) => v + 1)
            }}
          >
            {t('refresh')}
          </button>
          <p role="status">
            {state === 'loading'
              ? t('loading')
              : state === 'error'
                ? t('communityFailed')
                : ''}
          </p>
          <ul className="guest-list">
            {guests.map((g) => (
              <li key={g.handle.toLowerCase()}>
                <a
                  href={`https://www.instagram.com/${encodeURIComponent(g.handle)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{g.name}</span>
                  <span className="muted">@{g.handle} ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
