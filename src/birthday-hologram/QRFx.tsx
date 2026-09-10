import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { event, invitationUrl, publicAsset } from './event'
export default function QRFx() {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [copy, setCopy] = useState('')
  const url = invitationUrl()
  return (
    <div className="share-content">
      <p>{t('shareNote')}</p>
      {!failed && (
        <div className={`qr-art ${loaded ? 'qr-ready' : ''}`}>
          <img
            src={publicAsset('qr.svg')}
            width="256"
            height="256"
            alt={t('share')}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
          <svg viewBox="0 0 256 256" aria-hidden="true">
            <path
              pathLength="1"
              d="M16 16H240V240H16Z M24 64H232 M24 112H232 M24 160H232 M24 208H232"
            />
          </svg>
        </div>
      )}
      {failed && <p className="muted">{t('qrPending')}</p>}
      <label className="link-field">
        <span className="sr-only">{t('share')}</span>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      </label>
      <button
        className="pill-button"
        onClick={async () => {
          try {
            if (!navigator.clipboard) throw new Error('Clipboard unavailable')
            await navigator.clipboard.writeText(url)
            setCopy(t('copied'))
          } catch {
            setCopy(t('copyFailed'))
          }
        }}
      >
        {t('copy')}
      </button>
      <p role="status">{copy}</p>
      <a
        className="inline-link"
        href={event.backupUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('backup')} ↗
      </a>
    </div>
  )
}
