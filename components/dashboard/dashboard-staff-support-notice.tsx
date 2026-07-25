"use client";

import Link from "next/link";
import { useAdminSupportUnread } from "@/components/admin/admin-support-unread-poller";

function supportNoticeCopy(waitingOnStaff: number, unreadTotal: number): string {
  const parts: string[] = [];

  if (waitingOnStaff > 0) {
    parts.push(
      `${waitingOnStaff} ticket${waitingOnStaff === 1 ? "" : "s"} waiting on staff`,
    );
  }

  if (unreadTotal > 0) {
    parts.push(
      `${unreadTotal} unread ${unreadTotal === 1 ? "reply" : "replies"}`,
    );
  }

  return parts.join(" · ");
}

export function DashboardStaffSupportNotice({
  initialUnread = 0,
  initialWaitingOnStaff = 0,
}: {
  initialUnread?: number;
  initialWaitingOnStaff?: number;
}) {
  const { unreadTotal, waitingOnStaff } = useAdminSupportUnread(
    initialUnread,
    initialWaitingOnStaff,
  );

  const needsAttention = waitingOnStaff > 0 || unreadTotal > 0;
  if (!needsAttention) return null;

  return (
    <Link
      href="/dashboard/admin/support"
      className="bf-dash-staff-support-notice group block"
    >
      <span className="bf-dash-staff-support-notice__dot" aria-hidden />
      <span className="bf-dash-staff-support-notice__icon" aria-hidden>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">Support inbox needs attention</span>
        <span className="mt-0.5 block text-sm text-neutral-500">
          {supportNoticeCopy(waitingOnStaff, unreadTotal)}
        </span>
      </span>
      <span className="bf-dash-staff-support-notice__cta">Open inbox</span>
    </Link>
  );
}
