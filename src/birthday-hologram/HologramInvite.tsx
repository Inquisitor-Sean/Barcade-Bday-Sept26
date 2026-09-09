import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { birthday, inviteEvent, shareLinks } from './event'
import { eventDate, eventReady, googleCalendarUrl } from './calendar'
import QRFx from './QRFx'

interface Props {
  onBack: () => void
}

export default function HologramInvite({ onBack }: Props) {
  const { t, i18n } = useTranslation()
  const [backup, setBackup] = useState(false)

  const ready = eventReady(inviteEvent)
  const date = eventDate(inviteEvent, i18n.resolvedLanguage || 'en')
  const calendarUrl = googleCalendarUrl(inviteEvent, t('briefing'))

  return (
    <main className="invite-view">
      <button className="back-button" onClick={onBack}>
        ← {t('back')}
      </button>

      <article className="invitation-card">
        <section className="hologram-stage">
          <div className="projection-grid" aria-hidden="true" />
          <div className="projection-orbit" aria-hidden="true" />

          <div className="signal-heading">
            <span>{t('edition')}</span>
            <span>2026</span>
          </div>

          <div className="invite-title-row">
            <div>
              <p className="birthday-label">{t('birthday')}</p>
              <h1 id="invitation-title" tabIndex={-1}>
                {inviteEvent.host}
              </h1>
              <p className="hero-subtitle">{t('subtitle')}</p>
            </div>

            <div className="level-seal">
              <span>{t('level')}</span>
              <strong>{birthday.level}</strong>
            </div>
          </div>

          <div className="art-footer">
            <span>
              <span aria-hidden="true">♥ </span>
              {t('health')}
              <span className="health-segments" aria-hidden="true">
                {' '}▰▰▰▰▰▰▰▰
              </span>
              <span className="sr-only"> {t('fine')}</span>
            </span>

            <span>
              {t('survived')}{' '}
              <strong>
                {new Intl.NumberFormat(i18n.resolvedLanguage).format(
                  birthday.daysSurvived,
                )}
              </strong>
            </span>
          </div>
        </section>

        <section className="event-content">
          <div className="details-and-action">
            <dl className="event-details">
              <div>
                <dt>{t('when')}</dt>
                <dd>{date || t('datePending')}</dd>
              </div>

              <div>
                <dt>{t('where')}</dt>
                <dd>
                  {inviteEvent.venue || t('venuePending')}
                  <small>{inviteEvent.address || t('addressPending')}</small>
                </dd>
              </div>
            </dl>

            <div className="calendar-action">
              {ready ? (
                <a
                  className="primary-button"
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('addCalendar')} ↗
                </a>
              ) : (
                <button className="primary-button" disabled>
                  {t('addCalendar')}
                </button>
              )}

              <p>{t(ready ? 'calendarHint' : 'detailsPending')}</p>

              <button
                className="back-button"
                aria-expanded={backup}
                aria-controls="calendar-backup"
                onClick={() => setBackup(value => !value)}
              >
                {t('notWorking')}
              </button>

              {backup && (
                <div id="calendar-backup">
                  <QRFx
                    url={shareLinks.calendarUrl}
                    imageSrc={shareLinks.calendarQr}
                    kind="calendar"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="invite-notes">
            <p>
              <strong>{t('know')}</strong>
              {t('briefing')}
            </p>
            <p>
              <strong>{t('record')}</strong>
              {t('drinks')}
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}