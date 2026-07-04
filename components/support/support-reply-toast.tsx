"use client";

export function SupportReplyToast({
  subject,
  preview,
  onOpen,
  onDismiss,
}: {
  subject: string;
  preview: string;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="bf-support-reply-toast" role="status" aria-live="polite">
      <button type="button" onClick={onOpen} className="bf-support-reply-toast__main">
        <span className="bf-support-reply-toast__icon" aria-hidden>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="bf-support-reply-toast__title">Support replied · {subject}</span>
          <span className="bf-support-reply-toast__preview">{preview}</span>
        </span>
        <span className="bf-support-reply-toast__cta">Open</span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="bf-support-reply-toast__close"
        aria-label="Dismiss notification"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
