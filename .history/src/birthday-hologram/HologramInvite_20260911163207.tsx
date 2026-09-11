import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Panel from './Panel'
import AboutCircuitEffects from './AboutCircutEffects'
import './about-copy'
import './About-Game.css'

interface Props {
  onBack: () => void
  onCalendar: () => void
  onShare?: () => void
  onDetails?: () => void
  onPhotos?: () => void
  cancelled: boolean
}

type PanelName = 'details' | 'backpack' | 'friends' | 'share'

const links = {
  venue: 'https://barcade.com/location/los-angeles',
  maps:
    'https://www.google.com/maps/search/?api=1&query=' +
    '5684%20York%20Boulevard%2C%20Los%20Angeles%2C%20CA%2090042',
  photos:
    'https://drive.google.com/drive/folders/1o-mrP1tr9o0NX9e6EIWeH6noDUp0s9LL',
  instagram: 'https://www.instagram.com/sean_allan_/',
  twitch: 'https://www.twitch.tv/inquisitor_sean',
  backup:
    'https://letshang.co/events/d42da050-aca4-11f1-ac07-277190b21f9f/preview',
}

const faqs = [
  {
    id: 'work',
    question: 'what do you do?',
    answer: 'Experimental Coding with the Classic LA side hustle',
  },
  {
    id: 'from',
    question: 'Where are you from?',
    answer: 'San Bernardino',
  },
  {
    id: 'background',
    question: 'Whats your background',
    answer: "PreK Mod sever disabled /' education",
  },
  {
    id: 'education',
    question: 'Why no longer in ed?',
    answer:
      'I emotionally burnt out, I was with CPS easily 3-4 times a month. ' +
      'I decide if I am going to have functioning relationships I cannot ' +
      'come home righteously enraged with the system and burned out',
  },
  {
    id: 'weed',
    question: 'What your favorite weed?',
    answer: 'Hybrid',
  },
  {
    id: 'fun',
    question: 'What do you do for fun?',
    answer:
      'Art, building and actually finishing ludacris projects that serve ' +
      '0 commercial purpose, gardening, program...',
  },
]

function daysSurvived() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())

  const get = (type: string) =>
    Number(parts.find(part => part.type === type)?.value)

  const today = Date.UTC(get('year'), get('month') - 1, get('day'))
  const birthday = Date.UTC(1989, 8, 10)

  return Math.max(0, Math.floor((today - birthday) / 86_400_000))
}

export default function HologramInvite({
  onBack,
  onCalendar,
  cancelled,
}: Props) {
  const { t, i18n } = useTranslation()
  const [panel, setPanel] = useState<PanelName | null>(null)
  const [days, setDays] = useState(daysSurvived)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const locale = i18n.resolvedLanguage || 'en'
  const english = locale.toLowerCase().startsWith('en')

  const copy = (key: string, fallback: string) =>
    english ? fallback : t(`game.${key}`, { defaultValue: fallback })

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })

    const update = () => setDays(daysSurvived())
    const timer = window.setInterval(update, 60_000)

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
    timeZone: 'America/Los_Angeles',
  }).format(new Date('2026-09-26T21:30:00-07:00'))

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  })

  const time = english
    ? '9:30 PM–1 AM'
    : [
        timeFormatter.format(new Date('2026-09-26T21:30:00-07:00')),
        timeFormatter.format(new Date('2026-09-27T01:00:00-07:00')),
      ].join('–')

  const titles: Record<PanelName, string> = {
    details: copy('details', 'SIDE OBJECTIVES'),
    backpack: copy('backpack', 'BACKPACK'),
    friends: copy('friends', 'FRIEND LIST'),
    share: copy('share', 'SHARE THE QUEST'),
  }

  return (
    <main className="game-about">
      <AboutCircuitEffects />

      <div className="game-topbar">
        <button
          type="button"
          className="game-back"
          aria-label={t('back', { defaultValue: 'Back' })}
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
        </button>

        <span className="game-version">ALPHA v1</span>
      </div>

      <header className="game-hero">
        <h1 ref={titleRef} id="invitation-title" tabIndex={-1}>
          {copy('title', 'SEAN VS. EXISTENCE')}
        </h1>
      </header>

      <p
        className="game-design-note"
        style={{
          margin: '0 0 1rem',
          padding: '0.75rem 1rem',
          borderLeft: '3px solid #ffda94',
          borderRadius: '0.35rem',
          background: '#15130b',
          color: '#f3e7c8',
          fontFamily: 'var(--ui-font, sans-serif)',
          fontSize: 'clamp(0.9375rem, 0.85rem + 0.2vw, 1.25rem)',
          lineHeight: 1.5,
        }}
      >
        {english
          ? 'I ran out of time to finish the designs! There are still some visual mistakes, but everything should work. I might have time to update it—we’ll see. Let me know if something is broken.'
          : '¡No tuve tiempo de terminar los diseños! Todavía hay algunos errores visuales, pero todo debería funcionar. Quizá tenga tiempo de actualizarlo; ya veremos. Avísame si algo no funciona.'}
      </p>

      <dl className="game-stats">
        <div>
          <dt>{copy('level', 'LVL')}</dt>
          <dd>37</dd>
        </div>

        <div>
          <dt>{copy('health', 'HEALTH')}</dt>
          <dd>
            {copy('healthValue', 'STILL HERE')}
            <span className="health-segments" aria-hidden="true">
              {' '}▰▰▰▰▰
            </span>
          </dd>
        </div>

        <div>
          <dt>{copy('kd', 'KILL/DEATH RATIO')}</dt>
          <dd>1:0</dd>
        </div>

        <div>
          <dt>{copy('days', 'DAYS SURVIVED')}</dt>
          <dd>{new Intl.NumberFormat(locale).format(days)}</dd>
        </div>
      </dl>

      {cancelled && (
        <p role="alert">
          {t('cancelled', { defaultValue: 'Event cancelled' })}
        </p>
      )}

      <div className="game-grid">
        <section className="game-tile game-quest">
          <h2>{copy('quest', 'QUEST')}</h2>

          <p>
            {copy(
              'questCopy',
              "Arrive, or don't, I can't tell you what to do",
            )}
          </p>

          <div className="game-save">
            <h3>{copy('save', 'SAVE PROGRESS?')}</h3>
            <p>{copy('rsvp', 'No RSVP needed!')}</p>
          </div>
        </section>

        <section className="game-tile">
          <h2>{copy('when', 'WHEN')}</h2>

          <p>
            <time dateTime="2026-09-26">{date}</time>
          </p>

          <p>
            <strong>{time}</strong>
          </p>

          <p>
            {copy(
              'arrival',
              'Show up whenever, I’m planning to stay until 1 AM.',
            )}
          </p>
        </section>

        <section className="game-tile">
          <h2>{copy('map', 'MAP LOCATION')}</h2>

          <p>
            <a
              href={links.venue}
              target="_blank"
              rel="noopener noreferrer"
            >
              Barcade Los Angeles <span aria-hidden="true">↗</span>
            </a>
          </p>

          <p>
            <a
              href={links.maps}
              target="_blank"
              rel="noopener noreferrer"
            >
              5684 York Boulevard, Los Angeles, CA 90042{' '}
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>
      </div>

      <dl className="game-inventory">
        <div>
          <dt>{copy('equipment', 'EQUIPMENT')}</dt>
          <dd>{copy('equipmentCopy', 'ID')}</dd>
        </div>

        <div>
          <dt>{copy('food', 'FOOD')}</dt>
          <dd>{copy('foodCopy', 'Not a dinner thing')}</dd>
        </div>

        <div>
          <dt>{copy('gifts', 'GIFTS')}</dt>
          <dd>{copy('giftsCopy', 'NO GIFTS.')}</dd>
        </div>
      </dl>

      <nav
        className="game-actions"
        aria-label={copy('actions', 'Event actions')}
      >
        <button
          type="button"
          className="game-button game-button--primary"
          onClick={onCalendar}
          disabled={cancelled}
        >
          {copy('calendar', 'Add to calendar')}
          <span aria-hidden="true">↗</span>
        </button>

        {(['share', 'details', 'backpack', 'friends'] as const).map(name => (
          <button
            key={name}
            type="button"
            className="game-button"
            aria-haspopup="dialog"
            onClick={() => setPanel(name)}
          >
            {titles[name]}
            <span aria-hidden="true">+</span>
          </button>
        ))}
      </nav>

      {panel && (
        <Panel title={titles[panel]} onClose={() => setPanel(null)}>
          {panel === 'details' && (
            <>
              <section>
                <h3>{copy('find', 'SUB-OBJECTIVE: FIND SEAN')}</h3>

                <p>
                  {copy(
                    'findCopy',
                    'Can’t find me? Probably outside smoking weed searching for caffeine',
                  )}
                </p>
              </section>

              <section>
                <h3>{copy('consumables', 'CONSUMABLES')}</h3>

                <p>
                  {copy(
                    'consumablesCopy',
                    "Cannabis guy. I might have a drink or two so don't buy me alcohol so I have to awkwardly turn it down",
                  )}
                </p>
              </section>

              <section>
                <h3>{copy('sideObjectives', 'SIDE OBJECTIVES')}</h3>

                <p>
                  <strong>
                    {copy('noDrinkDrive', 'DO NOT DRINK AND DRIVE')}
                  </strong>
                </p>

                <p>
                  <strong>
                    {copy('noBabies', 'NO ACCIDENTAL BABIES')}
                  </strong>
                </p>
              </section>

              <section>
                <h3>
                  {copy('faqTitle', 'FAQ so I dont have to talk in loops')}
                </h3>

                {faqs.map(item => (
                  <details key={item.id}>
                    <summary>
                      {copy(`${item.id}Q`, item.question)}
                    </summary>
                    <p>{copy(`${item.id}A`, item.answer)}</p>
                  </details>
                ))}
              </section>
            </>
          )}

          {panel === 'backpack' && (
            <>
              <a
                href={links.photos}
                target="_blank"
                rel="noopener noreferrer"
              >
                {english ? (
                  <>
                    Open the <strong>PUBLIC</strong> photo folder ↗
                  </>
                ) : (
                  copy('photoLink', 'Open the PUBLIC photo folder ↗')
                )}
              </a>

              <p>
                {copy('publicBefore', 'This folder is')}{' '}
                <strong>{copy('publicWord', 'PUBLIC')}</strong>.{' '}
                {copy(
                  'publicAfter',
                  'I am not responsible for the life mistakes you upload',
                )}
              </p>
            </>
          )}

          {panel === 'friends' && (
            <>
              <p>
                <a
                  className="game-button"
                  href={links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy('instagram', 'Sean’s Instagram')}
                  <span aria-hidden="true">↗</span>
                </a>
              </p>

              <p>
                <a
                  className="game-button"
                  href={links.twitch}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy('twitch', 'Sean’s Twitch')}
                  <span aria-hidden="true">↗</span>
                </a>
              </p>

              <p>
                {copy(
                  'twitchCopy',
                  'A hobby. Gaming is my chosen time burner, so streaming gives me an excuse to learn sound and video engineering with an excuse to make art.',
                )}
              </p>
            </>
          )}

          {panel === 'share' && (
            <>
              <div className="game-qr-placeholder">
                <span aria-hidden="true">⌗</span>

                <p>
                  {copy(
                    'qrPending',
                    'QR CODE PLACEHOLDER — DEPLOYED WEBSITE LINK',
                  )}
                </p>
              </div>

              <section>
                <h3>{copy('backupRoute', 'BACKUP ROUTE')}</h3>

                <a
                  href={links.backup}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy('backupShare', 'Backup Share Link')}{' '}
                  <span aria-hidden="true">↗</span>
                </a>
              </section>

              <section>
                <h3>{copy('notWorking', 'NOT WORKING?')}</h3>

                <p>
                  {copy(
                    'calendarPending',
                    'BACKUP CALENDAR LINK / QR PLACEHOLDER',
                  )}
                </p>
              </section>
            </>
          )}
        </Panel>
      )}
    </main>
  )
}