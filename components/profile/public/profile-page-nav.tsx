"use client";

import type { ProfilePage } from "@/lib/profile-pages/slug";

export function ProfilePageNav({
  username,
  homeLabel,
  pages,
  activeSlug,
}: {
  username: string;
  homeLabel: string;
  pages: ProfilePage[];
  activeSlug?: string | null;
}) {
  if (pages.length === 0) return null;

  const homeActive = !activeSlug;

  return (
    <nav
      aria-label="Site pages"
      className="bf-profile-page-nav flex flex-wrap items-center justify-center gap-x-1 gap-y-0"
    >
      <NavTab href={`/${username}`} label={homeLabel} active={homeActive} />
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
    <a
      href={href}
      className={`relative shrink-0 px-4 py-2 text-[13px] font-medium tracking-wide transition-colors ${
        active
          ? "text-white"
          : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        {icon ? <span aria-hidden className="text-sm leading-none opacity-80">{icon}</span> : null}
        <span>{label}</span>
      </span>
      {active ? (
        <span
          className="absolute inset-x-3 -bottom-px h-px bg-white/80"
          aria-hidden
        />
      ) : null}
    </a>
  );
}
