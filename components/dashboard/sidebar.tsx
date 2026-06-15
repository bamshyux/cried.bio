"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  IconSettings,
} from "@/components/icons/dashboard-icons";
import { SITE_HOST } from "@/lib/site";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "design",
    label: "Design",
    items: [
      { href: "/dashboard/profile", label: "Profile", Icon: IconProfile },
      { href: "/dashboard/customize", label: "Customize", Icon: IconCustomize },
      { href: "/dashboard/background", label: "Background", Icon: IconBackground },
      { href: "/dashboard/themes", label: "Layouts", Icon: IconLayout },
      { href: "/dashboard/custom-theme", label: "Custom Theme", Icon: IconEffects },
      { href: "/dashboard/effects", label: "Effects", Icon: IconEffects },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { href: "/dashboard/links", label: "Links", Icon: IconLinks },
      { href: "/dashboard/embeds", label: "Embeds", Icon: IconLayout },
      { href: "/dashboard/widgets", label: "Widgets", Icon: IconEffects },
      { href: "/dashboard/featured", label: "Featured", Icon: IconBadges },
      { href: "/dashboard/music", label: "Music", Icon: IconMusic },
      { href: "/dashboard/guestbook", label: "Guestbook", Icon: IconProfile },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    items: [
      { href: "/dashboard/social", label: "Social", Icon: IconLinks },
      { href: "/dashboard/badges", label: "Badges", Icon: IconBadges },
      { href: "/dashboard/premium", label: "Premium", Icon: IconBadges },
      { href: "/dashboard/analytics", label: "Analytics", Icon: IconAnalytics },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavLink({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`bf-dash-nav-link flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
        active ? "bf-dash-nav-link--active" : ""
      }`}
    >
      <Icon size={15} className={active ? "text-white" : "text-neutral-500"} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  open,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const hasActive = group.items.some((item) => isActive(pathname, item.href));

  return (
    <div className="bf-dash-nav-group">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-400"
        aria-expanded={open}
      >
        {group.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {group.items.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      ) : hasActive ? (
        <div className="mt-1 px-2.5">
          {group.items
            .filter((item) => isActive(pathname, item.href))
            .map((item) => (
              <NavLink key={item.href} {...item} active />
            ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardSidebar({
  username,
  showManageAccounts = false,
}: {
  username?: string | null;
  showManageAccounts?: boolean;
}) {
  const pathname = usePathname();

  const defaultOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      open[group.id] = group.items.some((item) => isActive(pathname, item.href));
    }
    if (!Object.values(open).some(Boolean)) {
      open.design = true;
    }
    return open;
  }, [pathname]);

  const [openGroups, setOpenGroups] = useState(defaultOpen);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (group.items.some((item) => isActive(pathname, item.href))) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="bf-dash-sidebar flex w-full flex-col lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100vh-4.25rem)] lg:w-[240px] lg:shrink-0">
      <div className="mb-5 hidden lg:block">
        <CriedLogo size={28} />
      </div>

      <nav className="bf-dash-nav flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto lg:pr-1">
        <NavLink href="/dashboard" label="Overview" Icon={IconOverview} active={pathname === "/dashboard"} />

        {NAV_GROUPS.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            open={!!openGroups[group.id]}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}

        <div className="bf-dash-nav-group border-t border-white/[0.06] pt-3">
          <NavLink
            href="/dashboard/settings"
            label="Settings"
            Icon={IconSettings}
            active={pathname.startsWith("/dashboard/settings")}
          />
        </div>

        {showManageAccounts ? (
          <div className="bf-dash-nav-group space-y-1 border-t border-white/[0.06] pt-3">
            <NavLink
              href="/dashboard/accounts"
              label="Manage Accounts"
              Icon={IconProfile}
              active={pathname.startsWith("/dashboard/accounts")}
            />
            <NavLink
              href="/admin/moderation"
              label="Moderation"
              Icon={IconSettings}
              active={pathname.startsWith("/admin/moderation")}
            />
          </div>
        ) : null}
      </nav>

      {username ? (
        <div className="bf-dash-live-cta mt-4 shrink-0 lg:mt-3 lg:border-t lg:border-white/[0.06] lg:pt-3">
          <Link
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-2 transition-colors hover:border-white/[0.16] hover:bg-white/[0.07]"
          >
            <div className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-neutral-200 group-hover:text-white">
                View live profile
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10px] text-neutral-500">
                {SITE_HOST}/{username}
              </span>
            </div>
            <IconExternal
              size={13}
              className="shrink-0 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-300"
            />
          </Link>
        </div>
      ) : (
        <div className="bf-dash-live-cta mt-4 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-2.5 py-2.5 lg:mt-3 lg:border-t lg:border-white/[0.06] lg:pt-3">
          <p className="text-[12px] font-medium text-neutral-200">Profile not live yet</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Set a username in Profile to publish.</p>
          <Link
            href="/dashboard/profile"
            className="mt-2 inline-flex rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:border-white/15 hover:bg-white/[0.1] hover:text-white"
          >
            Set up profile
          </Link>
        </div>
      )}
    </aside>
  );
}
