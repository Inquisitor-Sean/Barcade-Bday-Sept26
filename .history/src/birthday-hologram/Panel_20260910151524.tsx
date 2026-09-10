import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  children: ReactNode
  onClose: () => void
}

export default function Panel({ title, children, onClose }: Props) {
  const { t } = useTranslation()
  const headingId = useId()

  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeCallback = useRef(onClose)
  const mounted = useRef(false)
  const dismissed = useRef(false)
  const outsidePointer = useRef<number | null>(null)

  useEffect(() => {
    closeCallback.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    mounted.current = true
    dismissed.current = false

    if (!dialog.open) dialog.showModal()

    return () => {
      mounted.current = false

      if (dialog.open) dialog.close()

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [])

  function dismiss() {
    if (!mounted.current || dismissed.current) return

    dismissed.current = true
    outsidePointer.current = null

    const dialog = dialogRef.current
    if (dialog?.open) dialog.close()

    closeCallback.current()
  }

  return (
    <dialog
      ref={dialogRef}
      className="utility-panel utility-panel-shell"
      aria-labelledby={headingId}
      onCancel={event => {
        event.preventDefault()
        dismiss()
      }}
      onClose={() => {
        if (!dialogRef.current?.open) dismiss()
      }}
      onPointerDown={event => {
        outsidePointer.current =
          event.target === event.currentTarget
            ? event.pointerId
            : null
      }}
      onPointerUp={event => {
        const tappedOutside =
          event.target === event.currentTarget &&
          outsidePointer.current === event.pointerId

        outsidePointer.current = null

        if (tappedOutside) {
          event.preventDefault()
          dismiss()
        }
      }}
      onPointerCancel={() => {
        outsidePointer.current = null
      }}
    >
      <div className="utility-panel-surface">
        <header className="panel-header">
          <h2 id={headingId}>{title}</h2>

          <button
            type="button"
            className="icon-button"
            aria-label={t('close')}
            onClick={dismiss}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="panel-body">{children}</div>
      </div>
    </dialog>
  )
}