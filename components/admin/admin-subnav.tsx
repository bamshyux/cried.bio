"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Dashboard", exact: true },
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/badges", label: "Badges" },
  { href: "/dashboard/admin/moderation", label: "Moderation" },
  { href: "/dashboard/admin/support", label: "Support Inbox" },
  { href: "/dashboard/admin/announcements", label: "Announcements" },
  { href: "/dashboard/admin/updates", label: "Updates" },
  { href: "/dashboard/admin/notifications", label: "Notifications" },
  { href: "/dashboard/admin/security", label: "Security" },
  { href: "/dashboard/admin/premium", label: "Premium" },
  { href: "/dashboard/admin/analytics", label: "Analytics" },
  { href: "/dashboard/admin/landing", label: "Landing Page" },
  { href: "/dashboard/admin/audit", label: "Audit Logs" },
  { href: "/dashboard/admin/owner", label: "Owner Tools", ownerOnly: true },
];

export function AdminSubnav({ role }: { role: "owner" | "admin" }) {
  const pathname = usePathname();

  return (
    <div className="bf-card overflow-x-auto p-2">
      <nav className="flex min-w-max gap-1">
        {ADMIN_LINKS.filter((link) => !link.ownerOnly || role === "owner").map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
