"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DiscordCommunityPromo } from "@/components/discord/discord-community-promo";
import {
  DASHBOARD_SECTIONS,
  getSectionForPath,
  isNavActive,
} from "@/lib/dashboard/navigation";

function SectionBlock({
  section,
  pathname,
  expanded,
  onToggle,
  isAdminRoute,
}: {
  section: (typeof DASHBOARD_SECTIONS)[number];
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  isAdminRoute: boolean;
}) {
  const active = isNavActive(pathname, section.href);
  const hasItems = section.items.length > 0;

  if (isAdminRoute && section.id !== "overview") return null;

  return (
    <div className="bf-dash-nav-section">
      <div className="flex items-center gap-1">
        <Link
          href={section.href}
          data-tour={section.id}
          className={`bf-dash-nav-link flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium ${
            active && !hasItems ? "bf-dash-nav-link--active" : active ? "text-white" : ""
          }`}
        >
          <span className={`inline-flex rounded-lg p-1.5 ${active ? "bg-white/[0.08] text-white" : "text-neutral-500"}`}>
            <section.Icon size={18} />
          </span>
          <span className="truncate">{section.label}</span>
        </Link>
        {hasItems ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-white/[0.04] hover:text-neutral-400"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${section.label}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      {hasItems && expanded ? (
        <div className="mt-1 space-y-0.5 border-l border-white/[0.06] pl-2 ml-5">
          {section.items.map((item) => {
            const itemActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  itemActive
                    ? "bg-white/[0.06] font-medium text-white"
                    : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
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
  const activeSection = getSectionForPath(pathname);

  const defaultExpanded = useMemo(() => {
    const ids: Record<string, boolean> = {};
    for (const section of DASHBOARD_SECTIONS) {
      ids[section.id] = activeSection?.id === section.id;
    }
    if (!activeSection) ids.appearance = true;
    return ids;
  }, [activeSection]);

  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (activeSection) {
      setExpanded((prev) => ({ ...prev, [activeSection.id]: true }));
    }
  }, [activeSection]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="bf-dash-sidebar flex w-full flex-col lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100vh-4.25rem)] lg:w-[260px] lg:shrink-0">
      <nav className="bf-dash-nav flex min-h-0 flex-1 flex-col gap-1 lg:overflow-y-auto lg:pr-2">
        {isAdminRoute ? (
          <div className="mb-3 space-y-1">
            <Link
              href="/dashboard"
              className="bf-dash-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-400"
            >
              <span className="inline-flex rounded-lg p-1.5 text-neutral-500">←</span>
              Back to dashboard
            </Link>
          </div>
        ) : null}

        {DASHBOARD_SECTIONS.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            pathname={pathname}
            expanded={!!expanded[section.id]}
            onToggle={() => toggle(section.id)}
            isAdminRoute={isAdminRoute}
          />
        ))}

        {showAdminPanel ? (
          <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
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

        <div className="mt-4 shrink-0 border-t border-white/[0.06] pt-4">
          <DiscordCommunityPromo variant="sidebar" />
        </div>
      </nav>
    </aside>
  );
}
