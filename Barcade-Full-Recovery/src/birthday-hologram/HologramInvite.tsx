import { useTranslation } from 'react-i18next'
import { event } from './event'

interface Props {
  onBack: () => void
  onShare: () => void
  onDetails: () => void
  onPhotos: () => void
  onCalendar: () => void
  cancelled: boolean
}

export default function HologramInvite(props: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage || 'en'
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: event.timeZone,
  }).format(new Date(`${event.date}T12:00:00-07:00`))
  const start =
    event.startsAt && Number.isFinite(Date.parse(event.startsAt))
      ? new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: event.timeZone,
        }).format(new Date(event.startsAt))
      : ''
  return (
    <main className="event-view">
      <button
        type="button"
        className="text-button back-link"
        onClick={props.onBack}
      >
        ← {t('back')}
      </button>
      <div className="event-composition">
        <header className="event-hero">
          <p className="overline">{t('eventTop')}</p>
          <h1
            id="invitation-title"
            tabIndex={-1}
            className="holo-title event-title"
          >
            {t('eventTitle')}
          </h1>
          <p className="event-intro">{t('eventSub')}</p>
          <span className="event-level" aria-hidden="true">
            {event.level}
          </span>
        </header>
        <section className="event-information" aria-label={t('details')}>
          <dl className="event-facts">
            <div>
              <dt>{t('when')}</dt>
              <dd>
                <time dateTime={event.date}>{date}</time>
                <small>
                  {start ? `${start} · ${t('until')}` : t('timePending')}
                  <span className="timezone">Los Angeles · PDT</span>
                </small>
              </dd>
            </div>
            <div>
              <dt>{t('where')}</dt>
              <dd>
                <a
                  href={event.venueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.venue} <span aria-hidden="true">↗</span>
                </a>
                <small>
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {event.address} ↗
                  </a>
                </small>
              </dd>
            </div>
          </dl>
          <div className="event-rules">
            <p>{t('openNote')}</p>
            <p>{t('noDinner')}</p>
            <p>{t('drinksTitle')}</p>
          </div>
          <div className="event-actions">
            <button
              type="button"
              className="pill-button"
              disabled={props.cancelled}
              onClick={props.onCalendar}
            >
              {t('calendar')} <span aria-hidden="true">↗</span>
            </button>
            <button
              type="button"
              className="text-button"
              onClick={props.onShare}
            >
              {t('share')} ↗
            </button>
          </div>
          <nav className="event-links" aria-label={t('extra')}>
            <button
              type="button"
              className="text-button"
              onClick={props.onDetails}
            >
              {t('details')} <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              className="text-button"
              onClick={props.onPhotos}
            >
              {t('photos')} <span aria-hidden="true">+</span>
            </button>
          </nav>
        </section>
      </div>
    </main>
  )
}
