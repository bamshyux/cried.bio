"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CriedLogo } from "@/components/brand/logo";
import {
  IconAnalytics,
  IconBackground,
  IconBadges,
  IconCustomize,
  IconEffects,
  IconExternal,
  IconLayout,
  IconLinks,
  IconMusic,
  IconOverview,
  IconProfile,
} from "@/components/icons/dashboard-icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", Icon: IconOverview },
  { href: "/dashboard/profile", label: "Profile", Icon: IconProfile },
  { href: "/dashboard/customize", label: "Customize", Icon: IconCustomize },
  { href: "/dashboard/background", label: "Background", Icon: IconBackground },
  { href: "/dashboard/themes", label: "Layouts", Icon: IconLayout },
  { href: "/dashboard/links", label: "Links", Icon: IconLinks },
  { href: "/dashboard/embeds", label: "Embeds", Icon: IconLayout },
  { href: "/dashboard/featured", label: "Featured", Icon: IconBadges },
  { href: "/dashboard/badges", label: "Badges", Icon: IconBadges },
  { href: "/dashboard/guestbook", label: "Guestbook", Icon: IconProfile },
  { href: "/dashboard/social", label: "Social", Icon: IconLinks },
  { href: "/dashboard/premium", label: "Premium", Icon: IconBadges },
  { href: "/dashboard/music", label: "Music", Icon: IconMusic },
  { href: "/dashboard/effects", label: "Effects", Icon: IconEffects },
  { href: "/dashboard/analytics", label: "Analytics", Icon: IconAnalytics },
];

export function DashboardSidebar({
  username,
  showManageAccounts = false,
}: {
  username?: string | null;
  showManageAccounts?: boolean;
}) {
  const pathname = usePathname();

  const navItems = showManageAccounts
    ? [
        ...NAV_ITEMS,
        { href: "/dashboard/accounts", label: "Manage Accounts", Icon: IconProfile },
      ]
    : NAV_ITEMS;

  return (
    <aside className="flex w-full flex-col lg:w-[220px] lg:shrink-0">
      <div className="mb-6 hidden lg:block">
        <CriedLogo size={28} />
      </div>

      <nav className="flex flex-wrap gap-0.5 lg:flex-col">
        {navItems.map(({ href, label, Icon }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`bf-nav-item flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium ${
                active ? "bf-nav-active" : ""
              }`}
            >
              <Icon size={16} className={active ? "text-[#fafafa]" : "text-neutral-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {username && (
        <Link
          href={`/${username}`}
          target="_blank"
          className="bf-nav-item mt-6 flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2.5 text-[13px] font-medium"
        >
          View live profile
          <IconExternal size={14} />
        </Link>
      )}
    </aside>
  );
}
