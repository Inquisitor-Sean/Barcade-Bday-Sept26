import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './QRFx.css'

interface Props {
  url: string
  imageSrc: string
  kind: 'invitation' | 'calendar'
}

export default function QRFx(props: Props) {
  return <QRContent key={`${props.url}|${props.imageSrc}`} {...props} />
}

function QRContent({ url, imageSrc, kind }: Props) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  let valid = false

  try {
    valid = ['https:', 'http:'].includes(new URL(url).protocol)
  } catch {
    valid = false
  }

  if (!valid) {
    return <p className="qr-pending" role="status">{t('linkPending')}</p>
  }

  const label = t(kind === 'calendar' ? 'calendarBackup' : 'share')

  return (
    <section className="qr-panel" aria-label={label}>
      {imageSrc && !failed && (
        <>
          {!loaded && <p role="status">{t('qrLoading')}</p>}

          <div className={`qr-art${loaded ? ' qr-ready' : ''}`}>
            <img
              src={imageSrc}
              alt={label}
              width="240"
              height="240"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />

            <svg viewBox="0 0 240 240" aria-hidden="true">
              <path d="M12 12H228V228H12V12 M24 60H216 M24 100H216 M24 140H216 M24 180H216" />
            </svg>
          </div>
        </>
      )}

      {(!imageSrc || failed) && <p>{t('qrPending')}</p>}

      <a href={url} target="_blank" rel="noopener noreferrer">
        {t(kind === 'calendar' ? 'openCalendar' : 'openLink')} ↗
      </a>
    </section>
  )
}