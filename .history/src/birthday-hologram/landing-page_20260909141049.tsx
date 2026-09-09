import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import HologramInvite from './HologramInvite'
import QRFx from './QRFx'
import { inviteEvent, shareLinks } from './event'
import { usePhoneMotion } from './motion'
import './Landing-Page.css'

interface Preferences {
  hue: number
  contrast: boolean
  reduced: boolean
}

function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem('invite-settings') || '{}')

    return {
      hue: typeof saved.hue === 'number' && Number.isFinite(saved.hue)
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
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed')
  const [sharing, setSharing] = useState(false)
  const openButton = useRef<HTMLButtonElement>(null)

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
    document.documentElement.lang = i18n.resolvedLanguage || 'en'
    document.title = `${inviteEvent.host} — ${t('birthday')}`

    try {
      localStorage.setItem('invite-language', i18n.resolvedLanguage || 'en')
    } catch {
      return
    }
  }, [i18n.resolvedLanguage, t])

  useEffect(() => {
    if (phase !== 'opening') return

    const timer = window.setTimeout(() => setPhase('open'), paused ? 0 : 1400)
    return () => window.clearTimeout(timer)
  }, [phase, paused])

  useEffect(() => {
    if (phase === 'open') {
      document.getElementById('invitation-title')?.focus()
    }
  }, [phase])

  function setHue(hue: number) {
    setPreferences(value => ({ ...value, hue }))
  }

  function chooseColor(element: HTMLDivElement, x: number, y: number) {
    const box = element.getBoundingClientRect()
    const angle = Math.atan2(
      y - box.top - box.height / 2,
      x - box.left - box.width / 2,
    )

    setHue(Math.round((angle * 180 / Math.PI + 450) % 360))
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
      className={`experience${paused ? ' reduced-motion' : ''}${preferences.contrast ? ' high-contrast' : ''}`}
      style={{
        '--hue': preferences.hue,
        '--accent': `hsl(${preferences.hue} 90% 78%)`,
      } as CSSProperties}
    >
      <header className="experience-header">
        <span className="edition">{t('edition')}</span>

        <label className="language-control">
          <span>{t('language')}</span>
          <select
            value={i18n.resolvedLanguage || 'en'}
            onChange={event => void i18n.changeLanguage(event.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>
      </header>

      <section className="front-controls" aria-label={t('settings')}>
        <button
          type="button"
          className="quiet-button"
          disabled={paused || motion.status === 'requesting'}
          aria-pressed={motion.status === 'on'}
          onClick={() => {
            if (motion.status === 'on') motion.disable()
            else void motion.enable()
          }}
        >
          {t(motion.status === 'on' ? 'disableMotion' : 'enableMotion')}
        </button>

        <label className="check-control">
          <input
            type="checkbox"
            checked={preferences.contrast}
            onChange={event => setPreferences(value => ({
              ...value,
              contrast: event.target.checked,
            }))}
          />
          {t('highContrast')}
        </label>

        <label className="check-control">
          <input
            type="checkbox"
            checked={paused}
            disabled={systemReduced}
            onChange={event => setPreferences(value => ({
              ...value,
              reduced: event.target.checked,
            }))}
          />
          {t('reduceMotion')}
        </label>

        <p className="control-status" role="status">
          {t(systemReduced ? 'systemMotion' : paused ? 'motionPaused' : motionMessage)}
        </p>
      </section>

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
          <main className={`landing-page ${phase}`}>
            <p className="eyebrow">{t('eyebrow')}</p>

            <div className="decrypt-display" aria-hidden="true">
              <div className="decrypt-ring ring-one" />
              <div className="decrypt-ring ring-two" />
              <div className="decrypt-ring ring-three" />

              <div className="decrypt-core">
                <span>{t('youre')}</span>
                <strong>{t('invited')}</strong>
                <small>{t(phase === 'opening' ? 'decrypting' : 'ready')}</small>
              </div>

              <div className="decrypt-sweep" />
            </div>

            <h1>{inviteEvent.host}</h1>
            <p className="landing-description">{t('tagline')}</p>

            <div className="landing-actions">
              <button
                ref={openButton}
                className="primary-button"
                disabled={phase === 'opening'}
                onClick={() => setPhase(paused ? 'open' : 'opening')}
              >
                {t(phase === 'opening' ? 'opening' : 'open')}
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
              {t(phase === 'opening' ? 'opening' : 'passAlong')}
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

            <section className="color-control" aria-label={t('color')}>
              <div
                className="color-wheel"
                aria-hidden="true"
                style={{ '--angle': `${preferences.hue}deg` } as CSSProperties}
                onPointerDown={event => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  chooseColor(event.currentTarget, event.clientX, event.clientY)
                }}
                onPointerMove={event => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    chooseColor(event.currentTarget, event.clientX, event.clientY)
                  }
                }}
              >
                <i />
              </div>

              <div>
                <label htmlFor="hologram-color">{t('color')}</label>
                <input
                  id="hologram-color"
                  type="range"
                  min="0"
                  max="359"
                  value={preferences.hue}
                  onChange={event => setHue(Number(event.target.value))}
                />
                <p>{t('colorHint')}</p>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  )
}