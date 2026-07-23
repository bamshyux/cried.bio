"use client";

import Link from "next/link";
import type { ProfilePage } from "@/lib/profile-pages/slug";

export function ProfilePageNav({
  username,
  pages,
  activeSlug,
}: {
  username: string;
  pages: ProfilePage[];
  activeSlug?: string | null;
}) {
  if (pages.length === 0) return null;

  const homeActive = !activeSlug;

  return (
    <nav
      aria-label="Site pages"
      className="bf-profile-page-nav mb-5 flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1"
    >
      <NavTab
        href={`/${username}`}
        label="Home"
        icon="🏠"
        active={homeActive}
      />
      {pages.map((page) => (
        <NavTab
          key={page.id}
          href={`/${username}/${page.slug}`}
          label={page.label || page.slug}
          icon={page.icon || undefined}
          active={activeSlug === page.slug}
        />
      ))}
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white/[0.1] text-white shadow-sm"
          : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-200"
      }`}
    >
      {icon ? <span aria-hidden className="text-base leading-none">{icon}</span> : null}
      <span>{label}</span>
    </Link>
  );
}
