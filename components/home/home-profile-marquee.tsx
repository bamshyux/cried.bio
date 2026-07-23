"use client";

import Image from "next/image";
import Link from "next/link";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return views.toLocaleString();
}

function MarqueeProfileCard({ profile }: { profile: LandingShowcaseProfile }) {
  const views = profile.view_count ?? 0;

  return (
    <Link
      href={`/${profile.username}`}
      className="group flex w-[15.5rem] shrink-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c0c]/90 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-500 bf-home-ease hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-[#101010] hover:shadow-[0_16px_48px_rgba(0,0,0,0.38)]"
    >
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          unoptimized
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 text-sm font-semibold ring-1 ring-white/10">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white group-hover:text-[#fafafa]">{profile.display_name}</p>
        <p className="truncate text-[11px] text-neutral-500">@{profile.username}</p>
      </div>

      {views > 0 ? (
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-neutral-500">
          {formatViews(views)} views
        </span>
      ) : null}
    </Link>
  );
}

export function HomeProfileMarquee({ profiles }: { profiles: LandingShowcaseProfile[] }) {
  const items = profiles.filter((profile) => profile.username);
  if (items.length < 2) return null;

  const loop = [...items, ...items];

  return (
    <div className="relative mt-12 w-full sm:mt-14">
      <div className="bf-home-marquee-mask overflow-hidden">
        <div className="bf-home-marquee-track flex w-max gap-3 px-6 py-1">
          {loop.map((profile, index) => (
            <MarqueeProfileCard key={`${profile.id}-${index}`} profile={profile} />
          ))}
        </div>
      </div>
    </div>
  );
}
