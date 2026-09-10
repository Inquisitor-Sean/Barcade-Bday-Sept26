import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
export default function Panel({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const el = dialog.current
    el?.showModal()
    return () => {
      el?.close()
      previous?.focus()
    }
  }, [])
  const { t } = useTranslation()
  return (
    <dialog
      className="utility-panel"
      ref={dialog}
      aria-labelledby={heading}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
    >
      <header className="panel-header">
        <h2 id={heading}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={t('close')}
        >
          ×
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </dialog>
  )
}
