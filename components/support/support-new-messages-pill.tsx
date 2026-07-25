"use client";

export function SupportNewMessagesPill({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <div className="bf-support-new-messages-wrap">
      <button type="button" onClick={onClick} className="bf-support-new-messages">
        NEW
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M6 12l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
