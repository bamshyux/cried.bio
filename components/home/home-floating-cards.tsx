"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import type { LandingProfile } from "@/lib/types/landing";

function FloatingCard({
  profile,
  style,
}: {
  profile: LandingProfile;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="bf-home-float-card pointer-events-none absolute w-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]/70 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
      style={style}
      aria-hidden
    >
      <div className="h-14 bg-gradient-to-br from-neutral-700/80 to-neutral-900" />
      <div className="relative px-3 pb-3 pt-0">
        <div className="-mt-6 mb-2 flex items-end gap-2">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[#111]"
              unoptimized
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-semibold ring-2 ring-[#111]">
              {(profile.display_name || profile.username).charAt(0)}
            </div>
          )}
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-[11px] font-medium text-white/85">{profile.display_name}</p>
            <p className="truncate text-[9px] text-neutral-500">@{profile.username}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-md bg-white/[0.08]" />
          <div className="h-2 w-4/5 rounded-md bg-white/[0.05]" />
          <div className="h-2 w-3/5 rounded-md bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function HomeFloatingCards({
  profiles,
  parallax: externalParallax,
}: {
  profiles: LandingProfile[];
  parallax?: { x: number; y: number };
}) {
  const [internalParallax, setInternalParallax] = useState({ x: 0, y: 0 });
  const parallax = externalParallax ?? internalParallax;

  const cards = useMemo(() => {
    const positions = [
      { top: "6%", left: "2%", animationDelay: "0s", rotate: "-7deg", depth: 1.2 },
      { top: "14%", right: "3%", animationDelay: "1.1s", rotate: "9deg", depth: 0.9 },
      { top: "52%", left: "0%", animationDelay: "2.2s", rotate: "5deg", depth: 1.4 },
      { top: "68%", right: "1%", animationDelay: "0.7s", rotate: "-11deg", depth: 1 },
      { top: "36%", left: "5%", animationDelay: "1.6s", rotate: "-3deg", depth: 0.8 },
      { top: "24%", right: "7%", animationDelay: "2.8s", rotate: "7deg", depth: 1.1 },
    ];
    return profiles.slice(0, positions.length).map((profile, i) => {
      const pos = positions[i];
      const parallaxX = parallax.x * 18 * pos.depth;
      const parallaxY = parallax.y * 12 * pos.depth;
      return {
        profile,
        style: {
          top: pos.top,
          left: pos.left,
          right: pos.right,
          opacity: 0.22,
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0) rotate(${pos.rotate})`,
          animationDelay: pos.animationDelay,
        } as CSSProperties,
      };
    });
  }, [profiles, parallax]);

  if (!cards.length) return null;

  const useExternalParallax = externalParallax !== undefined;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden max-lg:hidden"
      aria-hidden
      onMouseMove={
        useExternalParallax
          ? undefined
          : (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setInternalParallax({
                x: (event.clientX - rect.left) / rect.width - 0.5,
                y: (event.clientY - rect.top) / rect.height - 0.5,
              });
            }
      }
      onMouseLeave={useExternalParallax ? undefined : () => setInternalParallax({ x: 0, y: 0 })}
    >
      {cards.map(({ profile, style }) => (
        <FloatingCard key={profile.id} profile={profile} style={style} />
      ))}
    </div>
  );
}
