"use client";

import { GiftIcon } from "@/components/icons/gift-icon";
import { useEffect, useRef } from "react";

export function GiftReceivedToast({
  title,
  body,
  onDismiss,
}: {
  title: string;
  body?: string;
  onDismiss: () => void;
}) {
  return (
    <div className="bf-gift-toast" role="status" aria-live="polite">
      <div className="bf-gift-toast__main">
        <span className="bf-gift-toast__icon" aria-hidden>
          <GiftIcon size={22} />
        </span>
        <div className="min-w-0">
          <span className="bf-gift-toast__title">{title}</span>
          {body ? <span className="bf-gift-toast__preview">&ldquo;{body}&rdquo;</span> : null}
        </div>
      </div>
      <button type="button" onClick={onDismiss} className="bf-gift-toast__close" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export function GiftNotificationPoller({
  userId,
  onGift,
}: {
  userId: string | null;
  onGift: (alert: { id: string; title: string; body: string }) => void;
}) {
  if (!userId) return null;
  return <GiftNotificationPollerInner userId={userId} onGift={onGift} />;
}

function GiftNotificationPollerInner({
  userId,
  onGift,
}: {
  userId: string;
  onGift: (alert: { id: string; title: string; body: string }) => void;
}) {
  const lastSeenRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/gifts/notifications?since=${encodeURIComponent(lastSeenRef.current)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          notifications?: Array<{ id: string; title: string; body: string; created_at: string }>;
        };
        const items = data.notifications ?? [];
        if (items.length === 0) return;

        const newest = items[0];
        lastSeenRef.current = newest.created_at;
        onGift({
          id: newest.id,
          title: newest.title,
          body: newest.body,
        });
      } catch {
        // ignore polling errors
      }
    };

    const interval = window.setInterval(() => void poll(), 20_000);
    void poll();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId, onGift]);

  return null;
}
