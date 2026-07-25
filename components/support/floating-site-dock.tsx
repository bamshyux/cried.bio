"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SupportWidgetBody,
  SupportWidgetTrigger,
  SupportWidgetUnreadPoller,
} from "@/components/support/support-widget";
import { SupportReplyToast } from "@/components/support/support-reply-toast";
import { GiftNotificationPoller, GiftReceivedToast } from "@/components/gifts/gift-received-toast";
import type { SupportReplyAlert } from "@/lib/support/notifications";
import { isPublicProfilePath } from "@/lib/profile";
import { isBadgeCreationPath } from "@/lib/store/badge-creation-route";

const SCROLL_TOP_THRESHOLD = 240;

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > SCROLL_TOP_THRESHOLD);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="bf-site-dock__button bf-site-dock__button--top bf-site-dock__button--visible"
    >
      <svg
        className="h-5 w-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

export function FloatingSiteDock({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [replyAlert, setReplyAlert] = useState<SupportReplyAlert | null>(null);
  const [giftAlert, setGiftAlert] = useState<{ id: string; title: string; body: string } | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const giftDismissTimerRef = useRef<number | null>(null);

  const handleStaffReply = useCallback((alert: SupportReplyAlert) => {
    setReplyAlert(alert);
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = window.setTimeout(() => setReplyAlert(null), 12_000);
  }, []);

  const handleGiftReceived = useCallback((alert: { id: string; title: string; body: string }) => {
    setGiftAlert(alert);
    if (giftDismissTimerRef.current) window.clearTimeout(giftDismissTimerRef.current);
    giftDismissTimerRef.current = window.setTimeout(() => setGiftAlert(null), 12_000);
  }, []);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
      if (giftDismissTimerRef.current) window.clearTimeout(giftDismissTimerRef.current);
    },
    [],
  );

  if (isPublicProfilePath(pathname) || isBadgeCreationPath(pathname)) {
    return null;
  }

  return (
    <div className="bf-site-dock">
      {!open && giftAlert ? (
        <GiftReceivedToast
          title={giftAlert.title}
          body={giftAlert.body || undefined}
          onDismiss={() => setGiftAlert(null)}
        />
      ) : null}

      {!open && !giftAlert && replyAlert ? (
        <SupportReplyToast
          subject={replyAlert.subject}
          preview={replyAlert.preview}
          onOpen={() => {
            setReplyAlert(null);
            setOpen(true);
          }}
          onDismiss={() => setReplyAlert(null)}
        />
      ) : null}

      <GiftNotificationPoller userId={userId} onGift={handleGiftReceived} />

      {open ? (
        <SupportWidgetBody
          userId={userId}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen) setReplyAlert(null);
          }}
          onUnreadChange={setUnreadTotal}
        />
      ) : (
        <SupportWidgetUnreadPoller
          userId={userId}
          widgetOpen={false}
          onUnreadChange={setUnreadTotal}
          onStaffReply={handleStaffReply}
        />
      )}

      <div className="bf-site-dock__buttons">
        <ScrollToTopButton key={pathname} />
        <SupportWidgetTrigger
          userId={userId}
          unreadTotal={unreadTotal}
          open={open}
          onToggle={() => {
            setOpen((prev) => {
              const next = !prev;
              if (next) setReplyAlert(null);
              return next;
            });
          }}
        />
      </div>
    </div>
  );
}
