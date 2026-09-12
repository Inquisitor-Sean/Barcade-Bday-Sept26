import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  children: ReactNode;
  onClose: () => void;
  tone?: "teal" | "cyan" | "violet" | "amber";
}

export default function Panel({
  title,
  children,
  onClose,
  tone = "teal",
}: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeCallback = useRef(onClose);
  const closing = useRef(false);
  const outsidePointer = useRef<number | null>(null);

  useEffect(() => {
    closeCallback.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closing.current = false;

    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      closing.current = true;
      outsidePointer.current = null;

      if (dialog.open) dialog.close();

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    outsidePointer.current = null;
    closeCallback.current();
  }

  return (
    <dialog
      ref={dialogRef}
      className="utility-panel utility-panel-shell"
      data-tone={tone}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={() => {
        if (!dialogRef.current?.open) dismiss();
      }}
      onPointerDown={(event) => {
        outsidePointer.current =
          event.isPrimary &&
          event.button === 0 &&
          event.target === event.currentTarget
            ? event.pointerId
            : null;
      }}
      onPointerUp={(event) => {
        const outside =
          outsidePointer.current === event.pointerId &&
          event.target === event.currentTarget;

        outsidePointer.current = null;

        if (outside) {
          event.preventDefault();
          dismiss();
        }
      }}
      onPointerCancel={() => {
        outsidePointer.current = null;
      }}
    >
      <div className="utility-panel-surface">
        <div className="panel-energy" aria-hidden="true">
          <i />
          <i />
        </div>
        <header className="panel-header">
          <h2 id={headingId}>{title}</h2>

          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label={t("close", { defaultValue: "Close" })}
            onClick={dismiss}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="panel-body">{children}</div>
      </div>
    </dialog>
  );
}
