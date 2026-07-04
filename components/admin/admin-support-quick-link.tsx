"use client";

import Link from "next/link";
import { AdminSupportUnreadBadge, useAdminSupportUnread } from "@/components/admin/admin-support-unread-poller";

export function AdminSupportQuickLink({ initialUnread = 0 }: { initialUnread?: number }) {
  const { unreadTotal } = useAdminSupportUnread(initialUnread);

  return (
    <Link
      href="/dashboard/admin/support"
      className={`bf-card group flex items-center justify-between gap-4 p-5 transition-colors ${
        unreadTotal > 0
          ? "border-violet-500/25 bg-violet-500/[0.08] hover:border-violet-500/35"
          : "hover:border-white/[0.12]"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex rounded-xl border border-violet-500/25 bg-violet-500/15 p-3 text-violet-200">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Support Inbox</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {unreadTotal > 0
              ? `${unreadTotal} unread customer message${unreadTotal === 1 ? "" : "s"} waiting`
              : "Customer tickets, replies, and internal notes"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AdminSupportUnreadBadge count={unreadTotal} />
        <span className="text-neutral-600 transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}
