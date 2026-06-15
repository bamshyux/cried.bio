"use client";

import { useRef, useState } from "react";
import { SITE_HOST } from "@/lib/site";

type PreviewLink = {
  label: string;
};

type PreviewProfile = {
  username: string;
  displayName: string;
  tagline: string;
  bio: string;
  links: PreviewLink[];
  banner: string;
  avatar: string;
  views?: string;
};

const PROFILES: PreviewProfile[] = [
  {
    username: "nova",
    displayName: "Nova",
    tagline: "Artist · Designer",
    bio: "Digital art, motion, and quiet pixels.",
    links: [{ label: "Instagram" }, { label: "Behance" }, { label: "Shop" }],
    banner: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #111 100%)",
    avatar: "radial-gradient(circle at 35% 30%, #d4d4d4, #525252 70%)",
  },
  {
    username: "yourname",
    displayName: "Your Name",
    tagline: "Creator · Gamer",
    bio: "One link for everything I make and play.",
    links: [{ label: "Discord" }, { label: "Twitch" }, { label: "Portfolio" }],
    banner: "linear-gradient(160deg, #262626 0%, #0a0a0a 55%, #1f1f1f 100%)",
    avatar: "radial-gradient(circle at 30% 25%, #fafafa, #404040 68%)",
    views: "2.4k views",
  },
  {
    username: "echo",
    displayName: "Echo",
    tagline: "Music · Streams",
    bio: "Beats, sets, and late-night sessions.",
    links: [{ label: "Spotify" }, { label: "SoundCloud" }, { label: "YouTube" }],
    banner: "linear-gradient(200deg, #171717 0%, #333 45%, #0d0d0d 100%)",
    avatar: "radial-gradient(circle at 40% 35%, #e5e5e5, #737373 72%)",
  },
];

type ProfileCardProps = {
  profile: PreviewProfile;
  variant: "left" | "center" | "right";
  parallaxX: number;
  parallaxY: number;
};

function ProfileCard({ profile, variant, parallaxX, parallaxY }: ProfileCardProps) {
  const tilt =
    variant === "left"
      ? { rotateY: 18, rotateX: 4, x: 32, z: -52, scale: 0.88, opacity: 0.78 }
      : variant === "right"
        ? { rotateY: -18, rotateX: 4, x: -32, z: -52, scale: 0.88, opacity: 0.78 }
        : { rotateY: 0, rotateX: 0, x: 0, z: 48, scale: 1, opacity: 1 };

  const motionX = parallaxX * (variant === "center" ? 10 : variant === "left" ? 16 : -16);
  const motionY = parallaxY * 8;
  const extraRotateY =
    parallaxX * (variant === "left" ? -5 : variant === "right" ? 5 : 0);

  return (
    <article
      className={`bf-home-preview-card bf-home-preview-card--${variant} relative w-[min(100%,17.5rem)] shrink-0 max-lg:mx-auto`}
      style={{
        transform: `
          translate3d(${tilt.x + motionX}px, ${motionY}px, ${tilt.z}px)
          rotateY(${tilt.rotateY + extraRotateY}deg)
          rotateX(${tilt.rotateX + parallaxY * -4}deg)
          scale(${tilt.scale})
        `,
        opacity: tilt.opacity,
        zIndex: variant === "center" ? 30 : variant === "left" ? 10 : 20,
      }}
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="relative h-[4.5rem]" style={{ background: profile.banner }}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(9,9,9,0.85)_100%)]" />
          {profile.views ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-neutral-400 backdrop-blur-sm">
              {profile.views}
            </span>
          ) : null}
        </div>

        <div className="relative px-4 pb-4 pt-0">
          <div className="-mt-7 mb-3 flex items-end gap-3">
            <div
              className="relative h-14 w-14 shrink-0 rounded-full ring-2 ring-[#111]"
              style={{ background: profile.avatar }}
            >
              <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
            </div>
            <div className="min-w-0 pb-0.5">
              <p className="truncate text-sm font-semibold text-white">{profile.displayName}</p>
              <p className="truncate text-xs text-neutral-500">@{profile.username}</p>
            </div>
          </div>

          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{profile.tagline}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{profile.bio}</p>

          <div className="mt-4 space-y-1.5">
            {profile.links.map((link) => (
              <div
                key={link.label}
                className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-[#0a0a0a] px-3 py-2 text-sm text-neutral-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                {link.label}
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

export function HomePreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

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

  return (
    <section id="preview" className="mx-auto max-w-6xl px-6 pb-24 pt-4">
      <div
        ref={stageRef}
        className="bf-home-preview-stage relative mx-auto flex min-h-[22rem] max-w-4xl items-center justify-center"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="bf-home-preview-rig flex w-full items-center justify-center max-lg:flex-col max-lg:gap-6 lg:-space-x-6">
          <div className="max-lg:hidden">
            <ProfileCard profile={PROFILES[0]} variant="left" parallaxX={parallax.x} parallaxY={parallax.y} />
          </div>
          <ProfileCard profile={PROFILES[1]} variant="center" parallaxX={parallax.x} parallaxY={parallax.y} />
          <div className="max-lg:hidden">
            <ProfileCard profile={PROFILES[2]} variant="right" parallaxX={parallax.x} parallaxY={parallax.y} />
          </div>
        </div>
      </div>

      <p className="bf-home-preview-url mx-auto mt-8 max-w-md text-center text-sm text-neutral-600 lg:hidden">
        Preview profiles on cried.bio — yours can look like this.
      </p>
    </section>
  );
}
