"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdminSupportUnreadBadge,
  useAdminSupportUnread,
} from "@/components/admin/admin-support-unread-poller";

const ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Dashboard", exact: true },
  {
    href: "/dashboard/admin/support",
    label: "Support Inbox",
    highlight: true,
    showSupportBadge: true,
  },
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/badges", label: "Badges" },
  { href: "/dashboard/admin/moderation", label: "Moderation" },
  { href: "/dashboard/admin/announcements", label: "Announcements" },
  { href: "/dashboard/admin/updates", label: "Updates" },
  { href: "/dashboard/admin/notifications", label: "Notifications" },
  { href: "/dashboard/admin/security", label: "Security" },
  { href: "/dashboard/admin/premium", label: "Premium" },
  { href: "/dashboard/admin/store", label: "Store" },
  { href: "/dashboard/admin/analytics", label: "Analytics" },
  { href: "/dashboard/admin/landing", label: "Landing Page" },
  { href: "/dashboard/admin/audit", label: "Audit Logs" },
  { href: "/dashboard/admin/transactions", label: "Transactions", ownerOnly: true },
  { href: "/dashboard/admin/owner", label: "Owner Tools", ownerOnly: true },
];

export function AdminSubnav({
  role,
  initialSupportUnread = 0,
}: {
  role: "owner" | "admin";
  initialSupportUnread?: number;
}) {
  const pathname = usePathname();
  const { unreadTotal } = useAdminSupportUnread(initialSupportUnread);

  return (
    <div className="bf-card overflow-x-auto p-2">
      <nav className="flex min-w-max gap-1">
        {ADMIN_LINKS.filter((link) => !link.ownerOnly || role === "owner").map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const badgeCount = link.showSupportBadge ? unreadTotal : 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? link.highlight
                    ? "bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/25"
                    : "bg-white/[0.08] text-white"
                  : link.highlight && badgeCount > 0
                    ? "bg-violet-500/10 text-violet-200 hover:bg-violet-500/15 hover:text-white"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {link.label}
              {link.showSupportBadge ? <AdminSupportUnreadBadge count={badgeCount} /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
