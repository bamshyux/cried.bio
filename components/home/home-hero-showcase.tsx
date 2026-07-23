"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SITE_HOST } from "@/lib/site";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

type DemoPhase = "profile" | "background" | "music" | "widgets" | "pages";

const DEMO_PHASES: DemoPhase[] = ["profile", "background", "music", "widgets", "pages"];

const PHASE_LABELS: Record<DemoPhase, string> = {
  profile: "Profile",
  background: "Background",
  music: "Music",
  widgets: "Widgets",
  pages: "Pages",
};

const CARD_BACKGROUNDS = [
  "from-neutral-500/90 via-neutral-800 to-[#090909]",
  "from-zinc-400/80 via-neutral-900 to-[#090909]",
  "from-stone-400/70 via-neutral-800 to-black",
  "from-neutral-600/85 via-[#141414] to-black",
  "from-white/20 via-neutral-800 to-[#090909]",
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
    className: "left-[4%] top-[6%] max-lg:hidden",
    scale: 0.44,
    blur: 3.5,
    rotate: -5,
    floatClass: "bf-home-hero-float-a",
    zIndex: 3,
    offset: -2,
  },
  {
    id: "tr",
    className: "right-[4%] top-[5%] max-lg:hidden",
    scale: 0.42,
    blur: 3.5,
    rotate: 6,
    floatClass: "bf-home-hero-float-b",
    zIndex: 3,
    offset: 2,
  },
  {
    id: "left",
    className: "left-[-1%] top-[32%] max-lg:hidden",
    scale: 0.62,
    blur: 1.5,
    rotate: -7,
    floatClass: "bf-home-hero-float-c",
    zIndex: 6,
    offset: -1,
  },
  {
    id: "right",
    className: "right-[-1%] top-[34%] max-lg:hidden",
    scale: 0.6,
    blur: 1.5,
    rotate: 8,
    floatClass: "bf-home-hero-float-d",
    zIndex: 6,
    offset: 1,
  },
  {
    id: "hero",
    className: "left-1/2 top-[53%] -translate-x-1/2 max-sm:top-[55%]",
    scale: 1,
    blur: 0,
    rotate: 0,
    floatClass: "bf-home-hero-float-hero",
    zIndex: 10,
    offset: 0,
  },
];

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k views`;
  return `${views.toLocaleString()} views`;
}

function formatLayout(layout: string | null | undefined) {
  if (!layout) return "Custom layout";
  return `${layout.charAt(0).toUpperCase()}${layout.slice(1).replace(/_/g, " ")}`;
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: LandingShowcaseProfile;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-[3.35rem] w-[3.35rem] text-base",
  };

  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={size === "lg" ? 54 : size === "md" ? 40 : 36}
        height={size === "lg" ? 54 : size === "md" ? 40 : 36}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-[#121212]`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-400 to-neutral-700 font-semibold ring-2 ring-[#121212]`}
    >
      {profile.display_name.charAt(0).toUpperCase()}
    </div>
  );
}

function CardHeader({
  profile,
  themeIndex,
  isHero,
  demoPhase,
}: {
  profile: LandingShowcaseProfile;
  themeIndex: number;
  isHero: boolean;
  demoPhase?: DemoPhase;
}) {
  const gradient = CARD_BACKGROUNDS[themeIndex];
  const showBgDemo = isHero && demoPhase === "background";

  return (
    <div
      className={`relative overflow-hidden transition-all duration-700 bf-home-ease ${
        showBgDemo ? "h-32" : isHero ? "h-28" : "h-20"
      }`}
    >
      {profile.banner_url ? (
        <Image
          src={profile.banner_url}
          alt=""
          fill
          className={`object-cover transition-transform duration-[1.2s] bf-home-ease ${
            showBgDemo ? "scale-110" : "scale-100"
          }`}
          unoptimized
        />
      ) : profile.background_image_url ? (
        <Image
          src={profile.background_image_url}
          alt=""
          fill
          className={`object-cover transition-transform duration-[1.2s] bf-home-ease ${
            showBgDemo ? "scale-110" : "scale-100"
          }`}
          unoptimized
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
            showBgDemo ? "bf-home-demo-gradient" : ""
          }`}
        />
      )}

      {showBgDemo ? (
        <div className="bf-home-demo-gradient absolute inset-0 opacity-60 mix-blend-soft-light" />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.16),transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_35%,rgba(9,9,9,0.92)_100%)]" />

      {isHero && demoPhase ? (
        <span className="bf-home-glass absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-neutral-300">
          {PHASE_LABELS[demoPhase]}
        </span>
      ) : null}

      {profile.view_count && profile.view_count > 0 ? (
        <span className="bf-home-glass absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium text-neutral-300">
          {formatViews(profile.view_count)}
        </span>
      ) : null}
    </div>
  );
}

function HeroLiveCard({
  profile,
  demoPhase,
  themeIndex,
}: {
  profile: LandingShowcaseProfile;
  demoPhase: DemoPhase;
  themeIndex: number;
}) {
  const musicTitle = profile.music_title || "Profile track";
  const layoutLabel = formatLayout(profile.layout);
  const pageCount = Math.max(profile.page_count ?? 0, 1);
  const pageLabels = ["Home", "Links", "About", "Gallery"].slice(0, Math.min(pageCount, 4));

  return (
    <div className="bf-home-glass-card overflow-hidden rounded-[1.35rem]">
      <CardHeader profile={profile} themeIndex={themeIndex} isHero demoPhase={demoPhase} />

      <div className="relative px-4 pb-4 pt-0">
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <ProfileAvatar profile={profile} size="lg" />
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-sm font-semibold text-white">{profile.display_name}</p>
            <p className="truncate text-[11px] text-neutral-400">@{profile.username}</p>
          </div>
        </div>

        <div key={`${profile.username}-${demoPhase}`} className="bf-home-demo-swap min-h-[8.5rem]">
          {demoPhase === "profile" ? (
            <>
              <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">
                {profile.bio || "A cried.bio profile worth visiting."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {["Links", "Socials"].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[10px] text-neutral-300"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-neutral-500">{layoutLabel}</p>
            </>
          ) : null}

          {demoPhase === "background" ? (
            <div className="space-y-2.5">
              <p className="text-xs text-neutral-400">
                {profile.background_type === "particles"
                  ? "Particle effects"
                  : profile.background_type === "animated_gradient"
                    ? "Animated gradient"
                    : profile.background_type === "video"
                      ? "Video background"
                      : profile.background_type === "image"
                        ? "Custom image"
                        : "Custom background"}
              </p>
              <div className="bf-home-demo-gradient h-16 rounded-xl border border-white/[0.08]" />
              <p className="text-[10px] text-neutral-500">Live on cried.bio</p>
            </div>
          ) : null}

          {demoPhase === "music" ? (
            <div className="rounded-xl border border-white/[0.1] bg-[#0a0a0a]/80 p-3">
              <div className="flex items-center gap-2.5">
                <span className="bf-home-hero-play flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-[10px] text-white">
                  ▶
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-neutral-100">{musicTitle}</p>
                  <p className="truncate text-[9px] text-neutral-500">Music player</p>
                </div>
                <div className="flex h-6 items-end gap-0.5">
                  {[3, 6, 4, 8, 5, 7, 4].map((h, i) => (
                    <span
                      key={i}
                      className="bf-home-hero-bar w-0.5 rounded-full bg-white/40"
                      style={{ height: `${h * 2}px`, animationDelay: `${i * 0.07}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {demoPhase === "widgets" ? (
            <div className="space-y-2.5">
              <div className="flex gap-1.5">
                {["✦", "★", "◆"].map((badge) => (
                  <span
                    key={badge}
                    className="bf-home-hero-badge flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[10px] text-white/85"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] text-neutral-400">
                Guestbook · 12 messages
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] text-neutral-400">
                Discord presence · Online
              </div>
            </div>
          ) : null}

          {demoPhase === "pages" ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {pageLabels.map((label, i) => (
                  <span
                    key={label}
                    className={`rounded-full px-2.5 py-1 text-[10px] ${
                      i === 0
                        ? "bg-white/12 text-white"
                        : "border border-white/[0.08] text-neutral-400"
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-xs text-neutral-400">
                {pageCount > 1 ? `${pageCount} pages on one profile` : "Multi-page profiles available"}
              </p>
              <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
                <div className="h-2 w-2/3 rounded bg-white/10" />
                <div className="mt-2 h-2 w-1/2 rounded bg-white/[0.06]" />
              </div>
            </div>
          ) : null}
        </div>

        <Link
          href={`/${profile.username}`}
          className="mt-3 block text-center font-mono text-[9px] text-neutral-500 transition-colors duration-300 hover:text-neutral-300"
        >
          {SITE_HOST}/{profile.username}
        </Link>
      </div>
    </div>
  );
}

function SupportCard({
  profile,
  themeIndex,
  scale,
  blur,
  rotate,
  floatClass,
  parallaxX,
  parallaxY,
  depth,
}: {
  profile: LandingShowcaseProfile;
  themeIndex: number;
  scale: number;
  blur: number;
  rotate: number;
  floatClass: string;
  parallaxX: number;
  parallaxY: number;
  depth: number;
}) {
  const px = parallaxX * depth * 20;
  const py = parallaxY * depth * 12;

  return (
    <article className="w-[11.75rem] pointer-events-auto">
      <div className={floatClass}>
        <div
          className="bf-home-ease transition-[transform,opacity,filter] duration-700"
          style={{
            transform: `translate3d(${px}px, ${py}px, 0) scale(${scale}) rotate(${rotate + parallaxX * depth * 2.5}deg)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            opacity: blur > 3 ? 0.62 : 0.82,
          }}
        >
          <Link
            href={`/${profile.username}`}
            className="bf-home-glass-card group block overflow-hidden rounded-2xl transition-all duration-500 bf-home-ease hover:scale-[1.03] hover:border-white/[0.14]"
          >
            <CardHeader profile={profile} themeIndex={themeIndex} isHero={false} />
            <div className="relative px-3 pb-3 pt-0">
              <div className="-mt-6 mb-2 flex items-end gap-2">
                <ProfileAvatar profile={profile} size="sm" />
                <div className="min-w-0 pb-0.5">
                  <p className="truncate text-[11px] font-medium text-white group-hover:text-[#fafafa]">
                    {profile.display_name}
                  </p>
                  <p className="truncate text-[9px] text-neutral-500">@{profile.username}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}

function HeroCard({
  profile,
  themeIndex,
  demoPhase,
  scale,
  rotate,
  floatClass,
  parallaxX,
  parallaxY,
}: {
  profile: LandingShowcaseProfile;
  themeIndex: number;
  demoPhase: DemoPhase;
  scale: number;
  rotate: number;
  floatClass: string;
  parallaxX: number;
  parallaxY: number;
}) {
  const px = parallaxX * 14;
  const py = parallaxY * 10;

  return (
    <article className="w-[min(92vw,22rem)] pointer-events-auto sm:w-[24rem]">
      <div className={floatClass}>
        <div
          className="bf-home-ease transition-[transform] duration-700"
          style={{
            transform: `translate3d(${px}px, ${py}px, 0) scale(${scale}) rotate(${rotate + parallaxX * 1.5}deg)`,
          }}
        >
          <div className="bf-home-hero-card-glow rounded-[1.35rem]">
            <HeroLiveCard profile={profile} demoPhase={demoPhase} themeIndex={themeIndex} />
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
  profiles: LandingShowcaseProfile[];
  parallax: { x: number; y: number };
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [demoPhase, setDemoPhase] = useState<DemoPhase>("profile");

  const showcaseProfiles = useMemo(() => profiles.filter((p) => p.username), [profiles]);

  useEffect(() => {
    if (showcaseProfiles.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseProfiles.length);
      setDemoPhase("profile");
    }, 6500);
    return () => window.clearInterval(timer);
  }, [showcaseProfiles.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDemoPhase((current) => {
        const index = DEMO_PHASES.indexOf(current);
        return DEMO_PHASES[(index + 1) % DEMO_PHASES.length];
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const visibleSlots = useMemo(() => {
    if (!showcaseProfiles.length) return [];

    const len = showcaseProfiles.length;
    const at = (offset: number) => showcaseProfiles[(activeIndex + offset + len) % len];
    const heroSlot = SLOTS.find((s) => s.id === "hero")!;
    const supportSlots = SLOTS.filter((s) => s.id !== "hero");
    const maxSupport = Math.min(supportSlots.length, Math.max(0, len - 1));

    return [
      { slot: heroSlot, profile: at(0), isHero: true as const, themeIndex: activeIndex },
      ...supportSlots.slice(0, maxSupport).map((slot, i) => ({
        slot,
        profile: at(slot.offset),
        isHero: false as const,
        themeIndex: (activeIndex + slot.offset + len) % len,
      })),
    ];
  }, [activeIndex, showcaseProfiles]);

  if (!showcaseProfiles.length) return null;

  return (
    <div className="bf-home-hero-stage pointer-events-none absolute inset-0">
      <div
        aria-hidden
        className="bf-home-hero-floor-glow pointer-events-none absolute left-1/2 top-[58%] h-48 w-[min(100%,36rem)] -translate-x-1/2"
      />

      {visibleSlots.map(({ slot, profile, isHero, themeIndex }) => (
        <div
          key={`${slot.id}-${profile.id}-${activeIndex}`}
          className={`absolute ${slot.className}`}
          style={{ zIndex: slot.zIndex }}
        >
          {isHero ? (
            <HeroCard
              profile={profile}
              themeIndex={themeIndex}
              demoPhase={demoPhase}
              scale={slot.scale}
              rotate={slot.rotate}
              floatClass={slot.floatClass}
              parallaxX={parallax.x}
              parallaxY={parallax.y}
            />
          ) : (
            <SupportCard
              profile={profile}
              themeIndex={themeIndex}
              scale={slot.scale}
              blur={slot.blur}
              rotate={slot.rotate}
              floatClass={slot.floatClass}
              parallaxX={parallax.x}
              parallaxY={parallax.y}
              depth={slot.id === "left" || slot.id === "right" ? 1 : 0.75}
            />
          )}
        </div>
      ))}

      {showcaseProfiles.length > 1 ? (
        <div className="pointer-events-auto absolute bottom-[4%] left-1/2 flex -translate-x-1/2 gap-1.5">
          {showcaseProfiles.slice(0, 5).map((profile, index) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setDemoPhase("profile");
              }}
              className={`h-1 rounded-full transition-all duration-500 bf-home-ease ${
                index === activeIndex ? "w-5 bg-white" : "w-1 bg-white/30 hover:bg-white/55"
              }`}
              aria-label={`Show ${profile.display_name}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
