import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { event, invitationUrl } from './event'
import { calendarLinks, calendarReady, downloadCalendar } from './calendar'
import { useEventStatus } from './eventStatus'
import { usePhoneMotion } from '../motion'
import {
  colorKeys,
  contrastPalette,
  defaultPalette,
  savedAppearance,
} from '../palette'
import HologramInvite from './HologramInvite'
import SandHologram from '../SandHologram'
import Panel from '../Panel'
import Community from './Community'
import QRFx from '../QRFx'

type PanelName =
  | 'language'
  | 'accessibility'
  | 'colors'
  | 'share'
  | 'details'
  | 'photos'
  | 'calendar'
const titles: Record<PanelName, string> = {
  language: 'language',
  accessibility: 'accessibility',
  colors: 'colors',
  share: 'shareTitle',
  details: 'details',
  photos: 'photosTitle',
  calendar: 'calendarTitle',
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [appearance, setAppearance] = useState(savedAppearance)
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed')
  const [panel, setPanel] = useState<PanelName | null>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const previousPhase = useRef(phase)
  const paused = systemReduced || appearance.reduced
  const {
    vector,
    surfaceRef,
    status: motionStatus,
    enable,
    disable,
    movePointer,
  } = usePhoneMotion(paused)
  const status = useEventStatus()
  const cancelled = status.state === 'cancelled'
  const colors = appearance.contrast ? contrastPalette : appearance.colors
  const style = Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [`--${key}`, value]),
  ) as CSSProperties
  const description = [
    t('openNote'),
    t('noDinnerDetail'),
    t('drinks'),
    t('outside'),
    t('statusNote'),
    invitationUrl(),
  ].join('\n\n')
  const calendar = calendarLinks(description)
  const activeMotion = motionStatus === 'on' || motionStatus === 'waiting'

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setSystemReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('after-hours-appearance', JSON.stringify(appearance))
    } catch {
      /* The controls also work without storage. */
    }
  }, [appearance])
  useEffect(() => {
    const lang = i18n.resolvedLanguage || 'en'
    document.documentElement.lang = lang
    document.documentElement.dir = i18n.dir(lang)
    document.title = `${event.host} · ${t('heroTitle')} · 26.09.2026`
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', colors.background)
    try {
      localStorage.setItem('invite-language', lang)
    } catch {
      /* In-memory language remains active. */
    }
  }, [i18n, i18n.resolvedLanguage, t, colors.background])
  useEffect(() => {
    if (phase !== 'opening') return
    const timer = setTimeout(() => setPhase('open'), paused ? 0 : 1500)
    return () => clearTimeout(timer)
  }, [phase, paused])
  useEffect(() => {
    if (previousPhase.current === phase) return
    if (phase === 'open')
      document
        .getElementById('invitation-title')
        ?.focus({ preventScroll: true })
    if (phase === 'closed') opener.current?.focus({ preventScroll: true })
    previousPhase.current = phase
  }, [phase])

  const motionButton = (
    <button
      type="button"
      className={`text-button motion-toggle ${activeMotion ? 'is-active' : ''}`}
      disabled={paused || motionStatus === 'requesting'}
      aria-pressed={activeMotion}
      onClick={() => (activeMotion ? disable() : void enable())}
    >
      <span className="motion-symbol" aria-hidden="true">
        ◌
      </span>
      {t(activeMotion ? 'disable' : 'enable')}
    </button>
  )
  return (
    <div
      ref={surfaceRef}
      style={style}
      className={`experience ${phase === 'open' ? 'is-event' : 'is-landing'}${paused ? ' reduced-motion' : ''}${appearance.contrast ? ' high-contrast' : ''}${phase === 'opening' ? ' decrypting' : ''}`}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse' && !panel)
          movePointer(
            (e.clientX / window.innerWidth - 0.5) * 2,
            (e.clientY / window.innerHeight - 0.5) * 2,
          )
      }}
      onPointerLeave={() => movePointer(0, 0)}
    >
      <SandHologram
        motion={vector}
        colors={colors}
        paused={paused}
        opening={phase === 'opening'}
        eventView={phase === 'open'}
      />
      <header className="experience-header">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setPhase('closed')
          }}
          aria-label={`${event.host} · ${t('heroTitle')}`}
        >
          S<span aria-hidden="true"> / </span>37
        </a>
        <nav className="utility-nav" aria-label={t('accessibility')}>
          {(['language', 'accessibility', 'colors'] as const).map((name) => (
            <button
              type="button"
              className="text-button"
              key={name}
              aria-haspopup="dialog"
              onClick={() => setPanel(name)}
            >
              {name === 'language' && (
                <span className="language-glyph" aria-hidden="true">
                  文
                </span>
              )}
              {t(name)}
            </button>
          ))}
        </nav>
      </header>
      {phase === 'open' ? (
        <HologramInvite
          cancelled={cancelled}
          onBack={() => setPhase('closed')}
          onCalendar={() => setPanel('calendar')}
          onShare={() => setPanel('share')}
          onDetails={() => setPanel('details')}
          onPhotos={() => setPanel('photos')}
        />
      ) : (
        <main className="landing-page">
          <div className="landing-copy">
            <p className="overline">
              {event.host.toUpperCase()} ·{' '}
              {new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: event.timeZone,
              }).format(new Date(`${event.date}T12:00:00-07:00`))}
            </p>
            <h1 className="holo-title" data-text={t('heroTitle')}>
              {t('heroTitle')}
            </h1>
            <p className="landing-description">{t('heroSub')}</p>
          </div>
          <div className="landing-actions">
            <button
              type="button"
              ref={opener}
              className="pill-button decrypt-button"
              disabled={phase === 'opening'}
              onClick={() => setPhase(paused ? 'open' : 'opening')}
            >
              <span>{t(phase === 'opening' ? 'decrypting' : 'decrypt')}</span>
              <span className="decrypt-icon" aria-hidden="true">
                ↗
              </span>
            </button>
            <button
              type="button"
              className="text-button"
              aria-haspopup="dialog"
              onClick={() => setPanel('share')}
            >
              {t('share')} ↗
            </button>
            <span className="sr-only" role="status">
              {phase === 'opening' ? t('decrypting') : ''}
            </span>
          </div>
        </main>
      )}
      <footer className="experience-footer">
        <div className="footer-place">
          <span className="signal-dot" aria-hidden="true" />
          BARCADE · {t('location')}
        </div>
        <div className="motion-control">
          {motionButton}
          <span
            className={
              ['denied', 'unavailable', 'waiting', 'requesting'].includes(
                motionStatus,
              )
                ? 'motion-feedback'
                : 'sr-only'
            }
            role="status"
          >
            {t(paused ? 'paused' : motionStatus)}
          </span>
        </div>
      </footer>
      <aside
        className={`event-update${cancelled ? ' is-cancelled' : ''}`}
        role={cancelled ? 'alert' : 'status'}
      >
        {cancelled ? (
          <>
            <strong>{t('cancelled')}</strong>
            <span>{status.message || t('cancelledNote')}</span>
          </>
        ) : (
          <span>
            {status.error
              ? t('statusError')
              : !status.checked
                ? t('statusLoading')
                : status.message || t('statusNote')}
          </span>
        )}
        {(cancelled || status.error) && (
          <a href={event.backupUrl} target="_blank" rel="noopener noreferrer">
            {t('backup')} ↗
          </a>
        )}
      </aside>
      {panel && (
        <Panel title={t(titles[panel])} onClose={() => setPanel(null)}>
          {panel === 'language' && (
            <div className="language-options">
              {[
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Español' },
              ].map((lang) => (
                <button
                  type="button"
                  className="language-option"
                  lang={lang.code}
                  key={lang.code}
                  aria-pressed={i18n.resolvedLanguage === lang.code}
                  onClick={() => {
                    void i18n.changeLanguage(lang.code)
                    setPanel(null)
                  }}
                >
                  <span>{lang.label}</span>
                  <span aria-hidden="true">
                    {i18n.resolvedLanguage === lang.code ? '✓' : '↗'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {panel === 'accessibility' && (
            <div className="access-options">
              <p>{t('accessIntro')}</p>
              {motionButton}
              <p className="muted" role="status">
                {t(paused ? 'paused' : motionStatus)}
              </p>
              <label className="check-control">
                <input
                  type="checkbox"
                  checked={paused}
                  disabled={systemReduced}
                  onChange={(e) =>
                    setAppearance((v) => ({ ...v, reduced: e.target.checked }))
                  }
                />
                {t('reduced')}
              </label>
              <label className="check-control">
                <input
                  type="checkbox"
                  checked={appearance.contrast}
                  onChange={(e) =>
                    setAppearance((v) => ({ ...v, contrast: e.target.checked }))
                  }
                />
                {t('contrast')}
              </label>
            </div>
          )}
          {panel === 'colors' && (
            <>
              <p>{t('paletteIntro')}</p>
              <div className="color-options">
                {colorKeys.map((key) => (
                  <label className="color-option" key={key}>
                    <span>{t(key)}</span>
                    <input
                      type="color"
                      value={appearance.colors[key]}
                      onChange={(e) =>
                        setAppearance((v) => ({
                          ...v,
                          colors: { ...v.colors, [key]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="muted">{t('paletteNote')}</p>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setAppearance((v) => ({
                    ...v,
                    colors: { ...defaultPalette },
                  }))
                }
              >
                {t('reset')} ↺
              </button>
            </>
          )}
          {panel === 'share' && <QRFx />}
          {panel === 'details' && (
            <div className="detail-notes">
              {[
                ['openNote', 'openDetail'],
                ['noDinner', 'noDinnerDetail'],
                ['drinksTitle', 'drinks'],
                ['outsideTitle', 'outside'],
              ].map(([title, body]) => (
                <section key={title}>
                  <h3>{t(title)}</h3>
                  <p>{t(body)}</p>
                </section>
              ))}
              <p className="muted">{t('actualBirthday')}</p>
              <div className="host-links">
                <a
                  href={event.venueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('venue')} ↗
                </a>
                <a href={`tel:${event.phone}`}>{t('call')} ↗</a>
                <a
                  href={event.backupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('backup')} ↗
                </a>
                {event.additionalLink && (
                  <a
                    href={event.additionalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('extra')} ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {panel === 'photos' && (
            <>
              <strong className="public-label">{t('public')}</strong>
              <p>{t('publicNote')}</p>
              <a
                className="pill-button"
                href={event.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('drive')} ↗
              </a>
              <p className="muted">{t('photoAccess')}</p>
              <Community />
            </>
          )}
          {panel === 'calendar' && (
            <>
              {cancelled ? (
                <p>{t('cancelled')}</p>
              ) : calendarReady() ? (
                <div className="calendar-options">
                  <a
                    className="pill-button"
                    href={calendar.google}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('google')} ↗
                  </a>
                  <a
                    className="text-button"
                    href={calendar.outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('outlook')} ↗
                  </a>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => downloadCalendar(description)}
                  >
                    {t('apple')} ↓
                  </button>
                  <p className="muted">{t('alarm')}</p>
                </div>
              ) : (
                <p>{t('calendarPending')}</p>
              )}
              <a
                className="inline-link"
                href={event.backupUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('backup')} ↗
              </a>
            </>
          )}
        </Panel>
      )}
    </div>
  )
}
