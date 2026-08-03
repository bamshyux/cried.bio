"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashNavTearAccent } from "@/components/dashboard/dash-nav-tear";
import { DiscordCommunityPromo } from "@/components/discord/discord-community-promo";
import {
  DASHBOARD_SECTIONS,
  isNavActive,
  isSubNavItemActive,
} from "@/lib/dashboard/navigation";

function SectionBlock({
  section,
  pathname,
  isAdminRoute,
}: {
  section: (typeof DASHBOARD_SECTIONS)[number];
  pathname: string;
  isAdminRoute: boolean;
}) {
  const active = isNavActive(pathname, section.href);
  const hasItems = section.items.length > 0;
  const parentActive = active && hasItems;
  const [hovered, setHovered] = useState(false);
  const linkEngaged = active || parentActive || hovered;

  if (isAdminRoute && section.id !== "overview") return null;

  return (
    <div className="bf-dash-nav-section">
      <Link
        href={section.href}
        data-tour={section.id}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`bf-dash-nav-link relative overflow-hidden flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium ${
          active && !hasItems
            ? "bf-dash-nav-link--active"
            : parentActive
              ? "bf-dash-nav-link--parent-active"
              : ""
        }`}
      >
        <span
          className={`bf-dash-nav-icon relative z-[1] inline-flex rounded-lg p-1.5 ${
            active ? "bg-white/[0.08] text-white" : "text-neutral-500"
          }`}
        >
          <section.Icon size={18} />
        </span>
        <span className="relative z-[1] min-w-0 flex-1 truncate">{section.label}</span>
        <DashNavTearAccent engaged={linkEngaged} />
      </Link>

      {hasItems ? (
        <div className="bf-dash-nav-submenu mt-1 space-y-0.5 border-l pl-2 ml-5">
          {section.items.map((item) => {
            const itemActive = isSubNavItemActive(pathname, item, section.items);
            return (
              <SubNavLink key={`${item.href}-${item.label}`} href={item.href} active={itemActive}>
                {item.label}
              </SubNavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SubNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bf-dash-nav-sublink relative overflow-hidden block rounded-lg px-3 py-2 text-[13px] ${
        active ? "bf-dash-nav-sublink--active" : ""
      }`}
    >
      <span className="relative z-[1]">{children}</span>
      <DashNavTearAccent engaged={active || hovered} sub />
    </Link>
  );
}

function BackNavLink({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/dashboard"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bf-dash-nav-link relative overflow-hidden flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-400"
    >
      {children}
      <DashNavTearAccent engaged={hovered} />
    </Link>
  );
}

export function DashboardSidebar({
  showAdminPanel = false,
}: {
  showAdminPanel?: boolean;
  adminRole?: "owner" | "admin";
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  return (
    <aside className="bf-dash-sidebar flex w-full flex-col lg:w-[260px] lg:shrink-0">
      <nav className="bf-dash-nav flex flex-col gap-1 lg:pr-2">
        {isAdminRoute ? (
          <div className="mb-3 space-y-1">
            <BackNavLink>
              <span className="relative z-[1] inline-flex rounded-lg p-1.5 text-neutral-500">←</span>
              <span className="relative z-[1] flex-1">Back to dashboard</span>
            </BackNavLink>
          </div>
        ) : null}

        {DASHBOARD_SECTIONS.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            pathname={pathname}
            isAdminRoute={isAdminRoute}
          />
        ))}

        {showAdminPanel ? (
          <div className="bf-dash-nav-divider mt-4 space-y-3 border-t pt-4">
            <Link
              href="/dashboard/admin"
              className={`bf-dash-admin-link flex items-center gap-3 rounded-xl border px-3 py-3 text-[14px] font-medium transition-all ${
                isAdminRoute
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                  : "border-white/[0.06] bg-[#111] text-neutral-400 hover:border-violet-500/20 hover:text-violet-200"
              }`}
            >
              <span className="inline-flex rounded-lg bg-violet-500/15 p-1.5 text-violet-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 3 4 7v6c0 5 3.5 8 8 8s8-3 8-8V7l-8-4Z" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block text-white">Admin Panel</span>
                <span className="mt-0.5 block text-[11px] font-normal text-neutral-500">Platform management</span>
              </span>
            </Link>
            {isAdminRoute ? (
              <Link
                href="/dashboard/admin/support"
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all ${
                  pathname.startsWith("/dashboard/admin/support")
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-100"
                    : "border-white/[0.06] bg-[#101010] text-neutral-400 hover:border-violet-500/20 hover:text-violet-200"
                }`}
              >
                <span className="inline-flex rounded-lg bg-violet-500/10 p-1.5 text-violet-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                  </svg>
                </span>
                Support Inbox
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="bf-dash-nav-divider mt-4 border-t pt-4">
          <DiscordCommunityPromo variant="sidebar" />
        </div>
      </nav>
    </aside>
  );
}
