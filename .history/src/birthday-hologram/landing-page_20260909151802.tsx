import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import HologramInvite from './HologramInvite'
import QRFx from './QRFx'
import { inviteEvent, shareLinks } from './event'
import { usePhoneMotion } from './motion'

interface Preferences {
  hue: number
  contrast: boolean
  reduced: boolean
}

type Panel = 'language' | 'accessibility' | 'colors' | null

function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(
      localStorage.getItem('invite-settings') || '{}',
    )

    return {
      hue:
        typeof saved.hue === 'number' && Number.isFinite(saved.hue)
          ? Math.max(0, Math.min(359, saved.hue))
          : 195,
      contrast: saved.contrast === true,
      reduced: saved.reduced === true,
    }
  } catch {
    return { hue: 195, contrast: false, reduced: false }
  }
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [preferences, setPreferences] = useState(readPreferences)
  const [panel, setPanel] = useState<Panel>(null)
  const [sharing, setSharing] = useState(false)
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>(
    'closed',
  )
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const openButton = useRef<HTMLButtonElement>(null)
  const languageButton = useRef<HTMLButtonElement>(null)
  const accessibilityButton = useRef<HTMLButtonElement>(null)
  const colorsButton = useRef<HTMLButtonElement>(null)

  const paused = systemReduced || preferences.reduced
  const motion = usePhoneMotion(paused)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduced(media.matches)

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('invite-settings', JSON.stringify(preferences))
    } catch {
      return
    }
  }, [preferences])

  useEffect(() => {
    const language = i18n.resolvedLanguage || 'en'
    document.documentElement.lang = language
    document.documentElement.dir = i18n.dir(language)
    document.title = `${inviteEvent.host} — ${t('birthday')}`

    try {
      localStorage.setItem('invite-language', language)
    } catch {
      return
    }
  }, [i18n, i18n.resolvedLanguage, t])

  useEffect(() => {
    if (phase !== 'opening') return

    const timer = window.setTimeout(
      () => setPhase('open'),
      paused ? 0 : 1400,
    )

    return () => window.clearTimeout(timer)
  }, [phase, paused])

  useEffect(() => {
    if (phase === 'open') {
      document.getElementById('invitation-title')?.focus()
    }
  }, [phase])

  useEffect(() => {
    if (!panel) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      setPanel(null)

      if (panel === 'language') languageButton.current?.focus()
      if (panel === 'accessibility') accessibilityButton.current?.focus()
      if (panel === 'colors') colorsButton.current?.focus()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [panel])

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel(current => current === next ? null : next)
  }

  function decrypt() {
    if (phase !== 'closed') return

    setPanel(null)
    setSharing(false)
    setPhase(paused ? 'open' : 'opening')
  }

  const motionMessage = {
    off: 'motionOff',
    requesting: 'motionRequesting',
    on: 'motionOn',
    denied: 'motionDenied',
    unavailable: 'motionUnavailable',
  }[motion.status]

  return (
    <div
      className={`experience landing-shell${
        paused ? ' reduced-motion' : ''
      }${preferences.contrast ? ' high-contrast' : ''}`}
      style={{
        '--hue': preferences.hue,
        '--accent': `hsl(${preferences.hue} 90% 78%)`,
      } as CSSProperties}
    >
      <header className="landing-toolbar">
        <div className="toolbar-item">
          <button
            ref={languageButton}
            className="toolbar-button"
            aria-expanded={panel === 'language'}
            aria-controls="language-panel"
            onClick={() => togglePanel('language')}
          >
            {t('language')} <span aria-hidden="true">＋</span>
          </button>

          {panel === 'language' && (
            <section
              id="language-panel"
              className="toolbar-panel"
              aria-label={t('language')}
            >
              <label className="language-control">
                <span>{t('language')}</span>
                <select
                  value={i18n.resolvedLanguage || 'en'}
                  onChange={event => {
                    void i18n.changeLanguage(event.target.value)
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </label>
            </section>
          )}
        </div>

        <div className="toolbar-item">
          <button
            ref={accessibilityButton}
            className="toolbar-button"
            aria-expanded={panel === 'accessibility'}
            aria-controls="accessibility-panel"
            onClick={() => togglePanel('accessibility')}
          >
            {t('accessibility')} <span aria-hidden="true">＋</span>
          </button>

          {panel === 'accessibility' && (
            <section
              id="accessibility-panel"
              className="toolbar-panel"
              aria-label={t('accessibility')}
            >
              <label className="check-control">
                <input
                  type="checkbox"
                  checked={preferences.contrast}
                  onChange={event => {
                    const contrast = event.target.checked
                    setPreferences(value => ({ ...value, contrast }))
                  }}
                />
                {t('highContrast')}
              </label>

              <label className="check-control">
                <input
                  type="checkbox"
                  checked={paused}
                  disabled={systemReduced}
                  onChange={event => {
                    const reduced = event.target.checked
                    setPreferences(value => ({ ...value, reduced }))
                  }}
                />
                {t('reduceMotion')}
              </label>

              <button
                className="quiet-button"
                disabled={paused || motion.status === 'requesting'}
                aria-pressed={motion.status === 'on'}
                onClick={() => {
                  if (motion.status === 'on') motion.disable()
                  else void motion.enable()
                }}
              >
                {t(
                  motion.status === 'on'
                    ? 'disableMotion'
                    : 'enableMotion',
                )}
              </button>

              <p className="panel-note" role="status">
                {t(
                  systemReduced
                    ? 'systemMotion'
                    : paused
                      ? 'motionPaused'
                      : motionMessage,
                )}
              </p>
            </section>
          )}
        </div>

        <div className="toolbar-item">
          <button
            ref={colorsButton}
            className="toolbar-button"
            aria-expanded={panel === 'colors'}
            aria-controls="colors-panel"
            onClick={() => togglePanel('colors')}
          >
            {t('appearance')} <span aria-hidden="true">＋</span>
          </button>

          {panel === 'colors' && (
            <section
              id="colors-panel"
              className="toolbar-panel"
              aria-label={t('appearance')}
            >
              <label className="palette-control">
                <span>{t('color')}</span>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={preferences.hue}
                  onChange={event => {
                    const hue = Number(event.target.value)
                    setPreferences(value => ({ ...value, hue }))
                  }}
                />
              </label>
              <p className="panel-note">{t('colorHint')}</p>
            </section>
          )}
        </div>
      </header>

      <div ref={motion.surfaceRef} className="motion-surface">
        <div className="signal-tear" aria-hidden="true" />

        {phase === 'open' ? (
          <HologramInvite
            onBack={() => {
              setPhase('closed')
              window.setTimeout(() => openButton.current?.focus(), 0)
            }}
          />
        ) : (
          <main className={`landing-page decrypt-landing ${phase}`}>
            <div className="decrypt-display" aria-hidden="true">
              <div className="decrypt-ring ring-one" />
              <div className="decrypt-ring ring-two" />
              <div className="decrypt-ring ring-three" />

              <div className="decrypt-core">
                <span>{t('signal')}</span>
                <strong>
                  {t(phase === 'opening' ? 'decrypting' : 'sealed')}
                </strong>
                <small>
                  {t(phase === 'opening' ? 'opening' : 'awaiting')}
                </small>
              </div>

              <div className="decrypt-sweep" />
            </div>

            <h1>{inviteEvent.host}</h1>

            <div className="landing-actions">
              <button
                ref={openButton}
                className="primary-button"
                disabled={phase === 'opening'}
                onClick={decrypt}
              >
                {t(phase === 'opening' ? 'decryptingButton' : 'decryptButton')}
                <span aria-hidden="true">↗</span>
              </button>

              <button
                className="quiet-button"
                aria-expanded={sharing}
                aria-controls="invite-share"
                onClick={() => setSharing(value => !value)}
              >
                {t('share')}
              </button>
            </div>

            <p className="landing-status" role="status">
              {phase === 'opening' ? t('decryptingButton') : t('passAlong')}
            </p>

            {sharing && (
              <div id="invite-share">
                <QRFx
                  url={shareLinks.invitationUrl}
                  imageSrc={shareLinks.invitationQr}
                  kind="invitation"
                />
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  )
}