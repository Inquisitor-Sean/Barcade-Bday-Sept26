import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { event } from './event'
import Panel from './Panel'
import './about-copy'
import './About-Game.css'

interface Props {
  onBack: () => void
  onShare: () => void
  onDetails: () => void
  onPhotos: () => void
  onCalendar: () => void
  cancelled: boolean
}

type OpenPanel = 'details' | 'backpack' | 'friends' | 'share' | null

const backupUrl =
  'https://letshang.co/events/d42da050-aca4-11f1-ac07-277190b21f9f/preview'

function daysSurvived() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())

  const part = (type: string) =>
    Number(parts.find(item => item.type === type)?.value)

  const today = Date.UTC(part('year'), part('month') - 1, part('day'))
  const birth = Date.UTC(1989, 8, 10)

  return Math.max(0, Math.floor((today - birth) / 86400000))
}

export default function HologramInvite({
  onBack,
  onCalendar,
  cancelled,
}: Props) {
  const { t, i18n } = useTranslation()
  const [panel, setPanel] = useState<OpenPanel>(null)
  const [days, setDays] = useState(daysSurvived)

  const locale = i18n.resolvedLanguage || 'en'

  useEffect(() => {
    const update = () => setDays(daysSurvived())
    const timer = window.setInterval(update, 60000)

    document.addEventListener('visibilitychange', update)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: event.timeZone,
  }).format(new Date(event.startsAt))

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: event.timeZone,
  })

  const time = `${timeFormatter.format(
    new Date(event.startsAt),
  )}–${timeFormatter.format(new Date(event.endsAt))}`

  const panelTitle = {
    details: 'game.more',
    backpack: 'game.backpack',
    friends: 'game.friends',
    share: 'game.share',
  }

  return (
    <main className="event-view game-about">
      <div className="game-topbar">
        <button
          type="button"
          className="game-back"
          onClick={onBack}
          aria-label={t('back')}
        >
          <span aria-hidden="true">←</span>
        </button>

        <span className="game-version">ALPHA v1</span>
      </div>

      <header className="game-hero">
        <h1
          id="invitation-title"
          className="event-title"
          tabIndex={-1}
        >
          {t('game.title')}
        </h1>

        <dl className="game-stats" aria-label={t('game.stats')}>
          <div>
            <dt>{t('game.level')}</dt>
            <dd>{event.level}</dd>
          </div>

          <div>
            <dt>{t('game.health')}</dt>
            <dd>
              <span className="game-health" aria-hidden="true">
                ▰▰▰▰
              </span>
              {t('game.healthValue')}
            </dd>
          </div>

          <div>
            <dt>{t('game.kd')}</dt>
            <dd>1:0</dd>
          </div>

          <div>
            <dt>{t('game.days')}</dt>
            <dd>{new Intl.NumberFormat(locale).format(days)}</dd>
          </div>
        </dl>

        {cancelled && (
          <p className="game-cancelled" role="alert">
            {t('game.cancelled')}
          </p>
        )}
      </header>

      <div className="game-grid">
        <section className="game-tile game-quest">
          <h2>{t('game.quest')}</h2>
          <p className="game-quest-copy">{t('game.questCopy')}</p>

          <div className="game-save">
            <h3>{t('game.save')}</h3>
            <p>{t('game.rsvp')}</p>
          </div>
        </section>

        <section className="game-tile">
          <h2>{t('game.when')}</h2>
          <p className="game-value">
            <time dateTime={event.startsAt}>{date}</time>
          </p>
          <p className="game-time">{time}</p>
          <p className="game-muted">{t('game.arrival')}</p>
        </section>

        <section className="game-tile">
          <h2>{t('game.map')}</h2>

          <a
            className="game-value game-location"
            href={event.venueUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {event.venue} <span aria-hidden="true">↗</span>
          </a>

          <a
            className="game-address"
            href={event.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {event.address} <span aria-hidden="true">↗</span>
          </a>
        </section>
      </div>

      <dl className="game-inventory">
        <div>
          <dt>{t('game.equipment')}</dt>
          <dd>{t('game.equipmentCopy')}</dd>
        </div>
        <div>
          <dt>{t('game.food')}</dt>
          <dd>{t('game.foodCopy')}</dd>
        </div>
        <div>
          <dt>{t('game.gifts')}</dt>
          <dd>{t('game.giftsCopy')}</dd>
        </div>
      </dl>

      <nav className="game-actions" aria-label={t('game.actions')}>
        <button
          type="button"
          className="game-button game-button-primary"
          onClick={onCalendar}
          disabled={cancelled}
        >
          {t('game.calendar')}
          <span aria-hidden="true">↗</span>
        </button>

        <button
          type="button"
          className="game-button"
          aria-haspopup="dialog"
          onClick={() => setPanel('share')}
        >
          {t('game.share')}
          <span aria-hidden="true">↗</span>
        </button>

        <button
          type="button"
          className="game-button"
          aria-haspopup="dialog"
          onClick={() => setPanel('details')}
        >
          {t('game.more')}
          <span aria-hidden="true">+</span>
        </button>

        <button
          type="button"
          className="game-button"
          aria-haspopup="dialog"
          onClick={() => setPanel('backpack')}
        >
          {t('game.backpack')}
          <span aria-hidden="true">+</span>
        </button>

        <button
          type="button"
          className="game-button"
          aria-haspopup="dialog"
          onClick={() => setPanel('friends')}
        >
          {t('game.links')}
          <span aria-hidden="true">+</span>
        </button>
      </nav>

      {panel && (
        <Panel
          title={t(panelTitle[panel])}
          onClose={() => setPanel(null)}
        >
          <div className="game-panel-content">
            {panel === 'details' && (
              <>
                <section>
                  <h3>{t('game.find')}</h3>
                  <p>{t('game.findCopy')}</p>
                </section>

                <section>
                  <h3>{t('game.consumables')}</h3>
                  <p>{t('game.consumablesCopy')}</p>
                </section>

                <section>
                  <h3>{t('game.side')}</h3>
                  <p>{t('game.driveSafe')}</p>
                  <p>{t('game.babies')}</p>
                </section>

                <section>
                  <h3>{t('game.faq')}</h3>

                  {[
                    ['workQ', 'workA'],
                    ['fromQ', 'fromA'],
                    ['backgroundQ', 'backgroundA'],
                    ['educationQ', 'educationA'],
                    ['weedQ', 'weedA'],
                    ['funQ', 'funA'],
                  ].map(([question, answer]) => (
                    <details className="game-faq" key={question}>
                      <summary>{t(`game.${question}`)}</summary>
                      <p>{t(`game.${answer}`)}</p>
                    </details>
                  ))}
                </section>
              </>
            )}

            {panel === 'backpack' && (
              <>
                <p>
                  {t('game.publicBefore')}
                  <strong>{t('game.publicWord')}</strong>
                  {t('game.publicAfter')}
                </p>

                <a
                  className="game-button game-button-primary"
                  href={event.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('game.photoLink')}
                  <span aria-hidden="true">↗</span>
                </a>
              </>
            )}

            {panel === 'friends' && (
              <>
                <a
                  className="game-button"
                  href={event.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('game.instagram')}
                  <span aria-hidden="true">↗</span>
                </a>

                <a
                  className="game-button"
                  href={event.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('game.twitch')}
                  <span aria-hidden="true">↗</span>
                </a>

                <p>{t('game.hobby')}</p>
              </>
            )}

            {panel === 'share' && (
              <>
                <div className="game-qr-placeholder">
                  <span aria-hidden="true">⌗</span>
                  <strong>{t('game.qrPending')}</strong>
                  <p>{t('game.qrExplanation')}</p>
                </div>

                <a
                  className="game-button"
                  href={backupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('game.backup')}
                  <span aria-hidden="true">↗</span>
                </a>
              </>
            )}
          </div>
