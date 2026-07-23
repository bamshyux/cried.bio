"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/home/reveal";
import { SITE_HOST } from "@/lib/site";
import type { LandingProfile } from "@/lib/types/landing";

type PreviewProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  views?: number;
};

const FALLBACK_PROFILES: PreviewProfile[] = [
  {
    username: "nova",
    displayName: "Nova",
    bio: "Digital art, motion, and quiet pixels.",
    avatarUrl: null,
  },
  {
    username: "yourname",
    displayName: "Your Name",
    bio: "One link for everything I make and play.",
    avatarUrl: null,
    views: 2400,
  },
  {
    username: "echo",
    displayName: "Echo",
    bio: "Beats, sets, and late-night sessions.",
    avatarUrl: null,
  },
];

function toPreviewProfile(profile: LandingProfile, index: number): PreviewProfile {
  return {
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio || "A cried.bio profile worth visiting.",
    avatarUrl: profile.avatar_url,
    views: profile.view_count && profile.view_count > 0 ? profile.view_count : undefined,
  };
}

function formatViews(views: number) {
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k views`;
  return `${views.toLocaleString()} views`;
}

type ProfileCardProps = {
  profile: PreviewProfile;
  variant: "left" | "center" | "right";
  parallaxX: number;
  parallaxY: number;
};

function ProfileCard({ profile, variant, parallaxX, parallaxY }: ProfileCardProps) {
  const tilt =
    variant === "left"
      ? { rotateY: 16, rotateX: 5, x: 28, z: -48, scale: 0.86, opacity: 0.82 }
      : variant === "right"
        ? { rotateY: -16, rotateX: 5, x: -28, z: -48, scale: 0.86, opacity: 0.82 }
        : { rotateY: 0, rotateX: 0, x: 0, z: 40, scale: 1, opacity: 1 };

  const motionX = parallaxX * (variant === "center" ? 12 : variant === "left" ? 18 : -18);
  const motionY = parallaxY * 10;
  const extraRotateY = parallaxX * (variant === "left" ? -4 : variant === "right" ? 4 : 0);

  return (
    <article
      className={`bf-home-preview-card bf-home-preview-card--${variant} relative w-[min(100%,18rem)] shrink-0 max-lg:mx-auto`}
      style={{
        transform: `
          translate3d(${tilt.x + motionX}px, ${motionY}px, ${tilt.z}px)
          rotateY(${tilt.rotateY + extraRotateY}deg)
          rotateX(${tilt.rotateX + parallaxY * -3}deg)
          scale(${tilt.scale})
        `,
        opacity: tilt.opacity,
        zIndex: variant === "center" ? 30 : variant === "left" ? 10 : 20,
      }}
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111]/95 shadow-[0_28px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="relative h-20 bg-gradient-to-br from-neutral-700 via-neutral-800 to-[#090909]">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_35%,rgba(9,9,9,0.9)_100%)]" />
          {profile.views ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-neutral-400 backdrop-blur-sm">
              {formatViews(profile.views)}
            </span>
          ) : null}
        </div>

        <div className="relative px-4 pb-4 pt-0">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-[#111]"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 text-lg font-semibold ring-2 ring-[#111]">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pb-0.5">
              <p className="truncate text-sm font-semibold text-white">{profile.displayName}</p>
              <p className="truncate text-xs text-neutral-500">@{profile.username}</p>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">{profile.bio}</p>

          <div className="mt-4 space-y-1.5">
            {["Links", "Music", "Guestbook"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-[#0a0a0a] px-3 py-2 text-sm text-neutral-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                {label}
              </div>
            ))}
          </div>

          <p className="mt-3.5 text-center font-mono text-[10px] text-neutral-600">
            {SITE_HOST}/{profile.username}
          </p>
        </div>
      </div>
    </article>
  );
}

export function HomePreview({
  profiles = [],
  embedded = false,
}: {
  profiles?: LandingProfile[];
  embedded?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const previewProfiles = useMemo(() => {
    const mapped = profiles.map(toPreviewProfile);
    if (mapped.length >= 3) return mapped;
    return FALLBACK_PROFILES;
  }, [profiles]);

  useEffect(() => {
    if (previewProfiles.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previewProfiles.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [previewProfiles.length]);

  const leftIndex = (activeIndex - 1 + previewProfiles.length) % previewProfiles.length;
  const centerIndex = activeIndex;
  const rightIndex = (activeIndex + 1) % previewProfiles.length;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    setParallax({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  }

  function handlePointerLeave() {
    setParallax({ x: 0, y: 0 });
  }

  const content = (
    <>
      <div
        ref={stageRef}
        className={`bf-home-preview-stage relative mx-auto flex w-full items-center justify-center ${
          embedded ? "min-h-[20rem] max-w-none" : "min-h-[24rem] max-w-xl lg:max-w-none"
        }`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="bf-home-preview-rig flex w-full items-center justify-center max-lg:flex-col max-lg:gap-6 lg:-space-x-8">
          <div className="max-lg:hidden">
            <ProfileCard
              profile={previewProfiles[leftIndex]}
              variant="left"
              parallaxX={parallax.x}
              parallaxY={parallax.y}
            />
          </div>
          <ProfileCard
            profile={previewProfiles[centerIndex]}
            variant="center"
            parallaxX={parallax.x}
            parallaxY={parallax.y}
          />
          <div className="max-lg:hidden">
            <ProfileCard
              profile={previewProfiles[rightIndex]}
              variant="right"
              parallaxX={parallax.x}
              parallaxY={parallax.y}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {previewProfiles.slice(0, 6).map((profile, index) => (
          <button
            key={profile.username}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === centerIndex ? "w-6 bg-white" : "w-1.5 bg-white/25 hover:bg-white/40"
            }`}
            aria-label={`Preview ${profile.displayName}`}
          />
        ))}
      </div>

      <p className={`mx-auto max-w-md text-center text-sm text-neutral-500 ${embedded ? "mt-3" : "mt-4"}`}>
        Real cried.bio profiles —{" "}
        <Link href={`/${previewProfiles[centerIndex].username}`} className="text-neutral-300 underline-offset-2 hover:text-white hover:underline">
          @{previewProfiles[centerIndex].username}
        </Link>
      </p>
    </>
  );

  if (embedded) {
    return <div className="relative w-full">{content}</div>;
  }

  return (
    <Reveal variant="scale" delay={200} className="w-full">
      {content}
    </Reveal>
  );
}
