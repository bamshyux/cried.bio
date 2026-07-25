"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminSupportUnreadAction } from "@/app/actions/support";

function notifyStaffIfNeeded(nextUnread: number, previousUnread: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (nextUnread <= previousUnread) return;

  new Notification("New support message", {
    body: "A customer replied in the Support Inbox.",
    tag: "support-inbox",
  });
}

export function useAdminSupportUnread(initialUnread = 0, initialWaitingOnStaff = 0) {
  const [unreadTotal, setUnreadTotal] = useState(initialUnread);
  const [waitingOnStaff, setWaitingOnStaff] = useState(initialWaitingOnStaff);
  const previousUnreadRef = useRef(initialUnread);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAdminSupportUnreadAction();
      if (!result || "error" in result) return;
      notifyStaffIfNeeded(result.unreadTotal, previousUnreadRef.current);
      previousUnreadRef.current = result.unreadTotal;
      setUnreadTotal(result.unreadTotal);
      setWaitingOnStaff(result.waitingOnStaff);
      return result;
    } catch (error) {
      console.error("[admin/support] unread poll failed:", error);
    }
  }, []);

  useEffect(() => {
    previousUnreadRef.current = initialUnread;
    setUnreadTotal(initialUnread);
    setWaitingOnStaff(initialWaitingOnStaff);
  }, [initialUnread, initialWaitingOnStaff]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (initialUnread <= 0) return;

    void Notification.requestPermission();
  }, [initialUnread]);

  return { unreadTotal, waitingOnStaff, refresh };
}

export function AdminSupportUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
