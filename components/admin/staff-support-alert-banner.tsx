"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAdminSupportLatestAlertAction,
  fetchAdminSupportUnreadAction,
} from "@/app/actions/support";
import { useSupportRealtime } from "@/hooks/use-support-realtime";
import { playSupportMessageSound } from "@/lib/support/notifications";

export type StaffSupportAlert = {
  kind: "new_ticket" | "customer_reply";
  subject: string;
  preview: string;
  conversationId: string;
  customerName: string;
};

export function StaffSupportAlertBanner({
  isStaff,
  staffUserId,
  initialUnread = 0,
}: {
  isStaff: boolean;
  staffUserId: string | null;
  initialUnread?: number;
}) {
  const pathname = usePathname();
  const [alert, setAlert] = useState<StaffSupportAlert | null>(null);
  const prevUnreadRef = useRef(initialUnread);
  const prevWaitingRef = useRef(0);
  const initializedRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);

  const onAdminPanel = pathname.startsWith("/dashboard/admin");

  const refresh = useCallback(async () => {
    if (!isStaff || !staffUserId) return;

    const unreadResult = await fetchAdminSupportUnreadAction();
    if (!unreadResult || "error" in unreadResult) return;

    const shouldAlert =
      initializedRef.current && unreadResult.unreadTotal > prevUnreadRef.current;

    if (shouldAlert && !onAdminPanel) {
      playSupportMessageSound();

      const alertResult = await fetchAdminSupportLatestAlertAction();
      if (alertResult && !("error" in alertResult)) {
        const kind =
          unreadResult.waitingOnStaff > prevWaitingRef.current
            ? ("new_ticket" as const)
            : ("customer_reply" as const);

        setAlert({ ...alertResult, kind });

        if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = window.setTimeout(() => setAlert(null), 20_000);
      }
    }

    initializedRef.current = true;
    prevUnreadRef.current = unreadResult.unreadTotal;
    prevWaitingRef.current = unreadResult.waitingOnStaff;
  }, [isStaff, onAdminPanel, staffUserId]);

  useEffect(() => {
    prevUnreadRef.current = initialUnread;
  }, [initialUnread]);

  useEffect(() => {
    if (onAdminPanel) setAlert(null);
  }, [onAdminPanel]);

  useEffect(() => {
    if (!isStaff || !staffUserId || onAdminPanel) return;

    void refresh();
    const interval = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(interval);
  }, [isStaff, onAdminPanel, refresh, staffUserId]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    },
    [],
  );

  useSupportRealtime({
    userId: staffUserId,
    conversationId: null,
    isStaff: true,
    enabled: Boolean(isStaff && staffUserId && !onAdminPanel),
    onConversationChange: () => void refresh(),
    onMessageInsert: () => void refresh(),
  });

  if (!isStaff || onAdminPanel || !alert) return null;

  const title =
    alert.kind === "new_ticket"
      ? "New support ticket"
      : "Customer replied";

  return (
    <div className="bf-staff-support-alert" role="alert" aria-live="assertive">
      <div className="bf-staff-support-alert__glow" aria-hidden />
      <div className="bf-staff-support-alert__inner">
        <div className="bf-staff-support-alert__icon" aria-hidden>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="bf-staff-support-alert__eyebrow">Support inbox</p>
          <p className="bf-staff-support-alert__title">
            {title} · {alert.subject}
          </p>
          <p className="bf-staff-support-alert__meta">
            {alert.customerName}
            {alert.preview ? ` · ${alert.preview}` : null}
          </p>
        </div>

        <div className="bf-staff-support-alert__actions">
          <Link href="/dashboard/admin/support" className="bf-staff-support-alert__cta">
            Open inbox
          </Link>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="bf-staff-support-alert__dismiss"
            aria-label="Dismiss support alert"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
