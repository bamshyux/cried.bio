"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE_HOST } from "@/lib/site";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k views`;
  return `${views.toLocaleString()} views`;
}

function formatLayout(layout: string | null | undefined) {
  if (!layout) return null;
  return layout.charAt(0).toUpperCase() + layout.slice(1).replace(/_/g, " ");
}

function ProfileAvatar({ profile }: { profile: LandingShowcaseProfile }) {
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={72}
        height={72}
        className="h-[4.5rem] w-[4.5rem] rounded-full object-cover ring-2 ring-[#0c0c0c]"
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-xl font-semibold text-white ring-2 ring-[#0c0c0c]">
      {profile.display_name.charAt(0).toUpperCase()}
    </div>
  );
}

function FeaturedProfileCard({ profile }: { profile: LandingShowcaseProfile }) {
  const layoutLabel = formatLayout(profile.layout);
  const hasMusic = Boolean(profile.music_title?.trim());
  const pageCount = profile.page_count ?? 0;

  return (
    <Link
      href={`/${profile.username}`}
      className="group block overflow-hidden rounded-[1.25rem] border border-white/[0.09] bg-[#0e0e0e]/90 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-500 bf-home-ease hover:border-white/[0.14] hover:shadow-[0_40px_100px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-[#141414]">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt=""
            fill
            className="object-cover transition-transform duration-[1.4s] bf-home-ease group-hover:scale-[1.03]"
            unoptimized
            priority
          />
        ) : profile.background_image_url ? (
          <Image
            src={profile.background_image_url}
            alt=""
            fill
            className="object-cover transition-transform duration-[1.4s] bf-home-ease group-hover:scale-[1.03]"
            unoptimized
            priority
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-neutral-600/40 via-[#141414] to-[#090909]"
            style={profile.background_color ? { backgroundColor: profile.background_color } : undefined}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_20%,rgba(9,9,9,0.88)_100%)]" />
        {profile.view_count && profile.view_count > 0 ? (
          <span className="absolute right-4 top-4 rounded-full border border-white/[0.1] bg-black/40 px-2.5 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur-md">
            {formatViews(profile.view_count)}
          </span>
        ) : null}
      </div>

      <div className="relative px-6 pb-6 pt-0">
        <div className="-mt-10 mb-4 flex items-end gap-4">
          <ProfileAvatar profile={profile} />
          <div className="min-w-0 pb-1">
            <p className="truncate text-lg font-semibold tracking-tight text-white">{profile.display_name}</p>
            <p className="truncate text-sm text-neutral-500">@{profile.username}</p>
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">
          {profile.bio || "A cried.bio profile worth visiting."}
        </p>

        {(layoutLabel || hasMusic || pageCount > 1) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {layoutLabel ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-400">
                {layoutLabel}
              </span>
            ) : null}
            {hasMusic ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-400">
                {profile.music_title}
              </span>
            ) : null}
            {pageCount > 1 ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-400">
                {pageCount} pages
              </span>
            ) : null}
          </div>
        ) : null}

        <p className="mt-5 text-center font-mono text-[11px] text-neutral-600 transition-colors duration-300 group-hover:text-neutral-400">
          {SITE_HOST}/{profile.username}
        </p>
      </div>
    </Link>
  );
}

export function HomeHeroShowcase({ profiles }: { profiles: LandingShowcaseProfile[] }) {
  const showcaseProfiles = useMemo(() => profiles.filter((profile) => profile.username), [profiles]);
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (showcaseProfiles.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseProfiles.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [showcaseProfiles.length]);

  if (!showcaseProfiles.length) return null;

  const profile = showcaseProfiles[activeIndex];
  const tiltX = parallax.x * 6;
  const tiltY = parallax.y * 4;

  return (
    <div
      ref={stageRef}
      className="relative mx-auto w-full max-w-[26rem] sm:max-w-[28rem]"
      onMouseMove={(event) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        setParallax({
          x: (event.clientX - rect.left) / rect.width - 0.5,
          y: (event.clientY - rect.top) / rect.height - 0.5,
        });
      }}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div
        aria-hidden
        className="bf-home-hero-floor-glow pointer-events-none absolute left-1/2 top-[55%] h-40 w-[120%] -translate-x-1/2"
      />

      <div
        key={profile.id}
        className="bf-home-hero-profile bf-home-hero-profile-enter relative"
        style={{
          transform: `perspective(1200px) rotateX(${tiltY * -2}deg) rotateY(${tiltX * 2}deg) translate3d(${tiltX}px, ${tiltY}px, 0)`,
        }}
      >
        <FeaturedProfileCard profile={profile} />
      </div>

      {showcaseProfiles.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          {showcaseProfiles.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-1 rounded-full transition-all duration-500 bf-home-ease ${
                index === activeIndex ? "w-6 bg-white/80" : "w-1 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Show ${item.display_name}`}
            />
          ))}
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-neutral-600">
        Featured profile ·{" "}
        <span className="text-neutral-500">live on cried.bio</span>
      </p>
    </div>
  );
}
