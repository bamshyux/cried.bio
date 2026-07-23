"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SITE_HOST } from "@/lib/site";
import type { LandingProfile } from "@/lib/types/landing";

type ShowcaseProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  views?: number;
  themeIndex: number;
};

const CARD_BACKGROUNDS = [
  "from-neutral-500/90 via-neutral-800 to-[#090909]",
  "from-zinc-400/80 via-neutral-900 to-[#090909]",
  "from-stone-400/70 via-neutral-800 to-black",
  "from-neutral-600/85 via-[#141414] to-black",
  "from-white/25 via-neutral-800 to-[#090909]",
];

const FALLBACK: ShowcaseProfile[] = [
  {
    username: "nova",
    displayName: "Nova",
    bio: "Digital art, motion, and quiet pixels.",
    avatarUrl: null,
    views: 3200,
    themeIndex: 0,
  },
  {
    username: "echo",
    displayName: "Echo",
    bio: "Beats, sets, and late-night sessions.",
    avatarUrl: null,
    views: 1800,
    themeIndex: 1,
  },
  {
    username: "yourname",
    displayName: "Your Name",
    bio: "One link for everything I make and play.",
    avatarUrl: null,
    views: 940,
    themeIndex: 2,
  },
];

type SlotConfig = {
  id: string;
  className: string;
  scale: number;
  blur: number;
  rotate: number;
  floatClass: string;
  zIndex: number;
  offset: number;
};

const SLOTS: SlotConfig[] = [
  {
    id: "tl",
    className: "left-[5%] top-[5%] max-lg:hidden",
    scale: 0.46,
    blur: 4,
    rotate: -6,
    floatClass: "bf-home-hero-float-a",
    zIndex: 2,
    offset: -2,
  },
  {
    id: "tr",
    className: "right-[5%] top-[4%] max-lg:hidden",
    scale: 0.44,
    blur: 4,
    rotate: 7,
    floatClass: "bf-home-hero-float-b",
    zIndex: 2,
    offset: 2,
  },
  {
    id: "left",
    className: "left-[0%] top-[30%] max-lg:hidden",
    scale: 0.6,
    blur: 2,
    rotate: -8,
    floatClass: "bf-home-hero-float-c",
    zIndex: 4,
    offset: -1,
  },
  {
    id: "right",
    className: "right-[0%] top-[32%] max-lg:hidden",
    scale: 0.58,
    blur: 2,
    rotate: 9,
    floatClass: "bf-home-hero-float-d",
    zIndex: 4,
    offset: 1,
  },
  {
    id: "hero",
    className: "left-1/2 top-[56%] -translate-x-1/2 max-sm:top-[58%]",
    scale: 1,
    blur: 0,
    rotate: 0,
    floatClass: "bf-home-hero-float-hero",
    zIndex: 8,
    offset: 0,
  },
];

function toShowcase(profile: LandingProfile, index: number): ShowcaseProfile {
  return {
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio || "A cried.bio profile worth visiting.",
    avatarUrl: profile.avatar_url,
    views: profile.view_count && profile.view_count > 0 ? profile.view_count : undefined,
    themeIndex: index % CARD_BACKGROUNDS.length,
  };
}

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return views.toLocaleString();
}

function HeroProfileCard({
  profile,
  isHero,
  scale,
  blur,
  rotate,
  floatClass,
  parallaxX,
  parallaxY,
  depth,
}: {
  profile: ShowcaseProfile;
  isHero: boolean;
  scale: number;
  blur: number;
  rotate: number;
  floatClass: string;
  parallaxX: number;
  parallaxY: number;
  depth: number;
}) {
  const bg = CARD_BACKGROUNDS[profile.themeIndex];
  const px = parallaxX * depth * 22;
  const py = parallaxY * depth * 14;
  const width = isHero ? "w-[min(92vw,19rem)] sm:w-[21rem]" : "w-[11.5rem]";

  return (
    <article className={`${width} pointer-events-auto`}>
      <div className={floatClass}>
        <div
          className="transition-[transform,opacity,filter] duration-700 ease-out"
          style={{
            transform: `translate3d(${px}px, ${py}px, 0) scale(${scale}) rotate(${rotate + parallaxX * depth * 3}deg)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            opacity: isHero ? 1 : blur > 4 ? 0.55 : 0.78,
          }}
        >
        <div
          className={`overflow-hidden rounded-2xl border bg-[#161616]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md ${
            isHero
              ? "border-white/[0.16] shadow-[0_32px_100px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]"
              : "border-white/[0.1]"
          }`}
        >
          <div className={`relative h-24 bg-gradient-to-br ${bg}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(9,9,9,0.85)_100%)]" />
            {isHero ? (
              <div className="absolute left-3 top-3 flex gap-1">
                {["✦", "★"].map((badge) => (
                  <span
                    key={badge}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/30 text-[9px] text-white/90 backdrop-blur-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
            {profile.views ? (
              <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] font-medium text-neutral-300 backdrop-blur-sm">
                {formatViews(profile.views)} views
              </span>
            ) : null}
          </div>

          <div className="relative px-3.5 pb-3.5 pt-0">
            <div className="-mt-7 mb-2.5 flex items-end gap-2.5">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  width={isHero ? 52 : 40}
                  height={isHero ? 52 : 40}
                  className={`${isHero ? "h-[3.25rem] w-[3.25rem]" : "h-10 w-10"} rounded-full object-cover ring-2 ring-[#161616]`}
                  unoptimized
                />
              ) : (
                <div
                  className={`${isHero ? "h-[3.25rem] w-[3.25rem] text-base" : "h-10 w-10 text-sm"} flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-400 to-neutral-700 font-semibold ring-2 ring-[#161616]`}
                >
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 pb-0.5">
                <p className={`truncate font-semibold text-white ${isHero ? "text-sm" : "text-xs"}`}>
                  {profile.displayName}
                </p>
                <p className="truncate text-[10px] text-neutral-400">@{profile.username}</p>
              </div>
            </div>

            {isHero ? (
              <>
                <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">{profile.bio}</p>

                <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/90 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] text-white">
                      ▶
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-neutral-200">Now playing</p>
                      <p className="truncate text-[9px] text-neutral-500">Track on cried.bio</p>
                    </div>
                    <div className="flex h-5 items-end gap-0.5">
                      {[3, 5, 4, 7, 4, 6, 3].map((h, i) => (
                        <span
                          key={i}
                          className="bf-home-hero-bar w-0.5 rounded-full bg-white/35"
                          style={{ height: `${h * 2}px`, animationDelay: `${i * 0.08}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {["Links", "Guestbook"].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-neutral-300"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <Link
                  href={`/${profile.username}`}
                  className="mt-3 block text-center font-mono text-[9px] text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  {SITE_HOST}/{profile.username}
                </Link>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded bg-white/[0.1]" />
                <div className="h-1.5 w-4/5 rounded bg-white/[0.06]" />
                <div className="h-1.5 w-3/5 rounded bg-white/[0.04]" />
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </article>
  );
}

export function HomeHeroShowcase({
  profiles,
  parallax,
}: {
  profiles: LandingProfile[];
  parallax: { x: number; y: number };
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const showcaseProfiles = useMemo(() => {
    const mapped = profiles.map(toShowcase);
    return mapped.length >= 3 ? mapped : FALLBACK;
  }, [profiles]);

  useEffect(() => {
    if (showcaseProfiles.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseProfiles.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [showcaseProfiles.length]);

  const visibleSlots = useMemo(() => {
    const len = showcaseProfiles.length;
    const at = (offset: number) => showcaseProfiles[(activeIndex + offset + len) % len];
    const heroSlot = SLOTS.find((s) => s.id === "hero")!;
    const supportSlots = SLOTS.filter((s) => s.id !== "hero");
    const maxSupport = Math.min(supportSlots.length, Math.max(0, showcaseProfiles.length - 1));

    return [
      { slot: heroSlot, profile: at(0), isHero: true },
      ...supportSlots.slice(0, maxSupport).map((slot) => ({
        slot,
        profile: at(slot.offset),
        isHero: false,
      })),
    ];
  }, [activeIndex, showcaseProfiles]);

  return (
    <div className="bf-home-hero-stage pointer-events-none absolute inset-0">
      {visibleSlots.map(({ slot, profile, isHero }) => (
        <div
          key={`${slot.id}-${profile.username}-${activeIndex}`}
          className={`absolute ${slot.className}`}
          style={{ zIndex: slot.zIndex }}
        >
          <HeroProfileCard
            profile={profile}
            isHero={isHero}
            scale={slot.scale}
            blur={slot.blur}
            rotate={slot.rotate}
            floatClass={slot.floatClass}
            parallaxX={parallax.x}
            parallaxY={parallax.y}
            depth={isHero ? 0.6 : slot.id === "left" || slot.id === "right" ? 1 : 0.8}
          />
        </div>
      ))}

      <div className="pointer-events-auto absolute bottom-[5%] left-1/2 flex -translate-x-1/2 gap-1.5">
        {showcaseProfiles.slice(0, 5).map((profile, index) => (
          <button
            key={profile.username}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-5 bg-white" : "w-1 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Show ${profile.displayName}`}
          />
        ))}
      </div>
    </div>
  );
}
