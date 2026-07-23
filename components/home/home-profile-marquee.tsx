"use client";

import Image from "next/image";
import Link from "next/link";
import { LuPlay } from "react-icons/lu";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return views.toLocaleString();
}

function MarqueeProfileCard({ profile }: { profile: LandingShowcaseProfile }) {
  const bgUrl = profile.background_image_url || profile.banner_url;
  const musicTitle = profile.music_title?.trim();

  return (
    <Link
      href={`/${profile.username}`}
      className="group relative flex w-[17.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0c] shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-500 bf-home-ease hover:-translate-y-1 hover:border-white/[0.12]"
    >
      <div className="relative h-24 overflow-hidden bg-[#141414]">
        {bgUrl ? (
          <Image src={bgUrl} alt="" fill className="object-cover opacity-90" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-700/50 to-[#090909]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-transparent" />
        {profile.view_count && profile.view_count > 0 ? (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/[0.1] bg-black/45 px-2 py-0.5 text-[10px] text-neutral-400 backdrop-blur-sm">
            {formatViews(profile.view_count)} views
          </span>
        ) : null}
      </div>

      <div className="relative px-4 pb-4 pt-0">
        <div className="-mt-7 mb-3 flex items-end gap-2.5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-[#0c0c0c]"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 text-sm font-semibold ring-2 ring-[#0c0c0c]">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-sm font-medium text-white">{profile.display_name}</p>
            <p className="truncate text-[11px] text-neutral-500">@{profile.username}</p>
          </div>
        </div>

        {(profile.page_count ?? 0) > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-neutral-500">
              {(profile.page_count ?? 0) + 1} pages
            </span>
          </div>
        ) : null}

        {musicTitle ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
            <LuPlay className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden fill="currentColor" strokeWidth={0} />
            <p className="truncate text-[10px] text-neutral-400">{musicTitle}</p>
          </div>
        ) : (
          <div className="flex gap-1">
            {[4, 6, 5, 7, 4].map((h, i) => (
              <span
                key={i}
                className="bf-home-hero-bar w-0.5 rounded-full bg-white/25"
                style={{ height: `${h * 2}px`, animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function HomeProfileMarquee({ profiles }: { profiles: LandingShowcaseProfile[] }) {
  const items = profiles.filter((profile) => profile.username);
  if (items.length < 2) return null;

  const loop = [...items, ...items];

  return (
    <div className="relative mt-12 w-full overflow-hidden sm:mt-14">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#090909] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#090909] to-transparent sm:w-24" />

      <div className="bf-home-marquee-track flex w-max gap-4 px-4">
        {loop.map((profile, index) => (
          <MarqueeProfileCard key={`${profile.id}-${index}`} profile={profile} />
        ))}
      </div>
    </div>
  );
}
