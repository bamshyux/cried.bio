"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuAward, LuPlay } from "react-icons/lu";
import { SITE_HOST } from "@/lib/site";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return views.toLocaleString();
}

function ProfilePagePreview({ profile }: { profile: LandingShowcaseProfile }) {
  const bgUrl = profile.background_image_url || profile.banner_url;
  const musicTitle = profile.music_title?.trim() || "Profile track";
  const pageCount = profile.page_count ?? 0;

  return (
    <Link
      href={`/${profile.username}`}
      className="group relative block min-h-[26rem] w-full overflow-hidden rounded-[1.35rem] border border-white/[0.1] bg-[#080808] shadow-[0_40px_100px_rgba(0,0,0,0.62),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-500 bf-home-ease hover:border-white/[0.15] hover:shadow-[0_48px_120px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.07)]"
    >
      {bgUrl ? (
        <Image
          src={bgUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-[1.6s] bf-home-ease group-hover:scale-[1.04]"
          unoptimized
          priority
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-neutral-600/35 via-[#121212] to-[#090909]"
          style={profile.background_color ? { backgroundColor: profile.background_color } : undefined}
        />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />

      {profile.view_count && profile.view_count > 0 ? (
        <span className="absolute right-4 top-4 rounded-full border border-white/[0.1] bg-black/45 px-2.5 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur-md">
          {formatViews(profile.view_count)} views
        </span>
      ) : null}

      <div className="relative flex min-h-[26rem] flex-col items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-[18.5rem] rounded-2xl border border-white/[0.1] bg-[#0a0a0a]/72 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col items-center text-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={88}
                height={88}
                className="h-[5.5rem] w-[5.5rem] rounded-full object-cover ring-2 ring-white/10"
                unoptimized
              />
            ) : (
              <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-800 text-2xl font-semibold ring-2 ring-white/10">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}

            <p className="mt-4 text-xl font-semibold tracking-tight text-white">{profile.display_name}</p>
            <p className="mt-0.5 text-sm text-neutral-500">@{profile.username}</p>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-400">
              {profile.bio || "Creator on cried.bio"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[10px] text-neutral-300">
                <LuAward className="h-3 w-3 text-neutral-400" aria-hidden />
                Premium
              </span>
              {pageCount > 0 ? (
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-neutral-400">
                  {pageCount + 1} pages
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {["Links", "Socials", "Portfolio"].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-neutral-300 transition-colors group-hover:border-white/[0.1] group-hover:bg-white/[0.06]"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <LuPlay className="h-3 w-3" aria-hidden fill="currentColor" strokeWidth={0} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-neutral-200">{musicTitle}</p>
              <div className="mt-1.5 flex h-3 items-end gap-0.5">
                {[3, 5, 4, 7, 5, 6, 4, 8, 5].map((h, i) => (
                  <span
                    key={i}
                    className="bf-home-hero-bar w-0.5 rounded-full bg-white/35"
                    style={{ height: `${h * 2}px`, animationDelay: `${i * 0.06}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 font-mono text-[11px] text-neutral-600 transition-colors duration-300 group-hover:text-neutral-400">
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
  const tiltX = parallax.x * 8;
  const tiltY = parallax.y * 5;

  return (
    <div
      ref={stageRef}
      className="relative mx-auto w-full max-w-[min(100%,32rem)] sm:max-w-[34rem]"
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
        className="bf-home-hero-floor-glow pointer-events-none absolute left-1/2 top-[58%] h-48 w-[130%] -translate-x-1/2"
      />

      <div
        key={profile.id}
        className="bf-home-hero-profile bf-home-hero-profile-enter relative"
        style={{
          transform: `perspective(1400px) rotateX(${tiltY * -2.5}deg) rotateY(${tiltX * 2.5}deg) translate3d(${tiltX}px, ${tiltY}px, 0)`,
        }}
      >
        <ProfilePagePreview profile={profile} />
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
    </div>
  );
}
