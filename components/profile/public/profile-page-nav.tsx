"use client";

import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { PageNavPosition } from "@/lib/types/settings";

export function ProfilePageNav({
  username,
  homeLabel,
  pages,
  activeSlug,
  position = "top",
}: {
  username: string;
  homeLabel: string;
  pages: ProfilePage[];
  activeSlug?: string | null;
  position?: PageNavPosition;
}) {
  if (pages.length === 0) return null;

  const homeActive = !activeSlug;
  const vertical = position === "left" || position === "right";

  return (
    <nav
      aria-label="Site pages"
      className={`bf-profile-page-nav ${
        vertical
          ? "flex flex-col items-stretch gap-0.5"
          : "flex flex-wrap items-center justify-center gap-x-1 gap-y-0"
      }`}
    >
      <NavTab href={`/${username}`} label={homeLabel} active={homeActive} position={position} />
      {pages.map((page) => (
        <NavTab
          key={page.id}
          href={`/${username}/${page.slug}`}
          label={page.label || page.slug}
          icon={page.icon || undefined}
          active={activeSlug === page.slug}
          position={position}
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
  position,
}: {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
  position: PageNavPosition;
}) {
  const vertical = position === "left" || position === "right";

  return (
    <a
      href={href}
      className={`relative shrink-0 transition-colors ${
        vertical ? "rounded-lg px-3 py-2.5 text-left text-[13px]" : "px-4 py-2 text-[13px]"
      } ${position === "bottom" ? "pt-1" : ""} font-medium tracking-wide ${
        active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
      } ${vertical && active ? "bg-white/[0.06]" : ""}`}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        {icon ? <span aria-hidden className="text-sm leading-none opacity-80">{icon}</span> : null}
        <span>{label}</span>
      </span>
      {active ? <ActiveIndicator position={position} vertical={vertical} /> : null}
    </a>
  );
}

function ActiveIndicator({
  position,
  vertical,
}: {
  position: PageNavPosition;
  vertical: boolean;
}) {
  if (vertical) {
    return (
      <span
        className={`absolute top-2 bottom-2 w-0.5 rounded-full bg-white/80 ${
          position === "left" ? "left-0" : "right-0"
        }`}
        aria-hidden
      />
    );
  }

  if (position === "bottom") {
    return (
      <span
        className="absolute left-1/2 top-0 h-px w-8 -translate-x-1/2 -translate-y-full bg-white/80"
        aria-hidden
      />
    );
  }

  return (
    <span className="absolute inset-x-3 -bottom-px h-px bg-white/80" aria-hidden />
  );
}

export function resolvePageNavPosition(
  position: PageNavPosition | undefined | null,
  hasPages: boolean,
): PageNavPosition {
  if (!hasPages) return "top";
  if (!position || position === "hidden") return position ?? "top";
  return position;
}
