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
      className="bf-profile-page-nav flex items-center justify-center gap-1 overflow-x-auto"
    >
      <NavTab href={`/${username}`} label="Home" active={homeActive} />
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
      className={`relative shrink-0 px-4 py-2 text-[13px] font-medium tracking-wide transition-colors ${
        active
          ? "text-white"
          : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon ? <span aria-hidden className="text-sm leading-none opacity-80">{icon}</span> : null}
        <span>{label}</span>
      </span>
      {active ? (
        <span
          className="absolute inset-x-3 -bottom-px h-px bg-white/80"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
