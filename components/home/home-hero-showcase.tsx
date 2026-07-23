"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  LuAward,
  LuChartBar,
  LuImage,
  LuMessageSquare,
  LuMusic,
  LuPause,
  LuSparkles,
} from "react-icons/lu";
import { FaDiscord, FaInstagram, FaSpotify, FaXTwitter } from "react-icons/fa6";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

type Tilt = { x: number; y: number };

function MockShell({
  children,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pad = size === "sm" ? "p-3" : size === "lg" ? "p-5" : "p-3.5";
  return (
    <div
      className={`rounded-2xl border border-white/[0.11] bg-[#0a0a0a]/78 shadow-[0_28px_72px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_1px_0_rgba(255,255,255,0.08)_inset] backdrop-blur-2xl ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

function ProfileCardMock({ profile }: { profile: LandingShowcaseProfile }) {
  return (
    <Link href={`/${profile.username}`} className="block transition-transform duration-500 bf-home-ease hover:scale-[1.02]">
      <MockShell size="lg" className="w-[15.5rem] sm:w-[17rem]">
      <div className="flex flex-col items-center text-center">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={72}
            height={72}
            className="h-[4.5rem] w-[4.5rem] rounded-full object-cover ring-2 ring-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            unoptimized
          />
        ) : (
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-neutral-400 to-neutral-700 text-xl font-semibold ring-2 ring-white/12">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="mt-3.5 text-[15px] font-semibold tracking-tight text-white">{profile.display_name}</p>
        <p className="mt-0.5 text-xs text-neutral-500">@{profile.username}</p>
        <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
          {["Portfolio", "Links", "Store"].map((label) => (
            <span
              key={label}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-neutral-300"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      </MockShell>
    </Link>
  );
}

function MusicPlayerMock({ title }: { title: string }) {
  return (
    <MockShell className="w-[11.5rem]">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-600/50 to-neutral-900 shadow-inner">
          <LuMusic className="h-4 w-4 text-white/70" aria-hidden />
          <span className="bf-home-hero-play absolute inset-0 rounded-xl ring-1 ring-white/10" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-white">{title}</p>
          <p className="text-[10px] text-neutral-500">Now playing</p>
          <div className="mt-1.5 flex h-3 items-end gap-0.5">
            {[4, 7, 5, 9, 6, 8, 5, 7, 4].map((h, i) => (
              <span
                key={i}
                className="bf-home-hero-bar w-0.5 rounded-full bg-white/40"
                style={{ height: `${h * 2}px`, animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
          <LuPause className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </MockShell>
  );
}

function DiscordWidgetMock() {
  return (
    <MockShell className="w-[12.5rem]">
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2]/30 text-sm font-bold text-[#aeb4ff]">
            D
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FaDiscord className="h-3 w-3 text-[#5865F2]" aria-hidden />
            <p className="truncate text-[11px] font-medium text-white">discord.gg/you</p>
          </div>
          <p className="mt-1 text-[10px] text-emerald-400/90">Online</p>
          <p className="mt-1.5 truncate text-[10px] text-neutral-500">
            Playing <span className="text-neutral-300">Spotify</span>
          </p>
        </div>
      </div>
    </MockShell>
  );
}

function GuestbookMock() {
  return (
    <MockShell className="w-[11rem]">
      <div className="flex items-center gap-2">
        <LuMessageSquare className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
        <p className="text-[11px] font-medium text-neutral-300">Guestbook</p>
        <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-neutral-500">12</span>
      </div>
      <div className="mt-2.5 space-y-2">
        {[
          { name: "alex", msg: "love the vibe ✦" },
          { name: "maya", msg: "this is clean" },
        ].map((entry) => (
          <div key={entry.name} className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700" />
            <p className="text-[10px] leading-snug text-neutral-500">
              <span className="text-neutral-400">@{entry.name}</span> {entry.msg}
            </p>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function SocialLinksMock() {
  const icons = [
    { Icon: FaXTwitter, label: "X" },
    { Icon: FaInstagram, label: "Instagram" },
    { Icon: FaSpotify, label: "Spotify" },
    { Icon: FaDiscord, label: "Discord" },
  ];

  return (
    <MockShell className="w-[10.5rem]">
      <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">Socials</p>
      <div className="flex gap-2">
        {icons.map(({ Icon, label }) => (
          <span
            key={label}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-neutral-400"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/[0.08]" />
        <div className="h-1.5 w-4/5 rounded-full bg-white/[0.05]" />
      </div>
    </MockShell>
  );
}

function AnalyticsMock({ views }: { views: number }) {
  const display = views >= 1000 ? `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k` : views.toLocaleString();
  const bars = [28, 42, 35, 58, 48, 72, 55, 68, 62, 78];

  return (
    <MockShell className="w-[10.5rem]">
      <div className="flex items-center gap-2">
        <LuChartBar className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">Analytics</p>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-white">{display}</p>
      <p className="text-[10px] text-emerald-400/85">+12% this week</p>
      <div className="mt-2.5 flex h-8 items-end gap-0.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-white/20"
            style={{ height: `${h}%`, opacity: 0.35 + (i / bars.length) * 0.45 }}
          />
        ))}
      </div>
    </MockShell>
  );
}

function BackgroundSelectorMock() {
  const swatches = [
    "linear-gradient(135deg, #1a1a2e, #16213e)",
    "linear-gradient(135deg, #2d1b4e, #0f0f0f)",
    "linear-gradient(135deg, #1f2937, #111827)",
    "linear-gradient(135deg, #374151, #1f2937)",
  ];

  return (
    <MockShell className="w-[11.5rem]">
      <div className="flex items-center gap-2">
        <LuImage className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">Background</p>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        {swatches.map((bg, i) => (
          <span
            key={i}
            className={`aspect-square rounded-lg ${i === 1 ? "ring-2 ring-white/50 ring-offset-1 ring-offset-[#0a0a0a]" : "ring-1 ring-white/[0.08]"}`}
            style={{ background: bg }}
          />
        ))}
      </div>
    </MockShell>
  );
}

function BadgeComponentMock() {
  const badges = [
    { label: "Premium", Icon: LuAward, accent: "text-[#d4c4a8]" },
    { label: "Early", Icon: LuSparkles, accent: "text-sky-300/90" },
    { label: "Gifter", Icon: LuAward, accent: "text-rose-300/90" },
  ];

  return (
    <MockShell className="w-[10rem]">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">Badges</p>
      <div className="flex flex-wrap gap-1.5">
        {badges.map(({ label, Icon, accent }, i) => (
          <span
            key={label}
            className={`bf-home-hero-badge inline-flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.05] px-2 py-1 text-[9px] font-medium text-neutral-300 ${i === 0 ? "shadow-[0_0_20px_rgba(212,196,168,0.15)]" : ""}`}
          >
            <Icon className={`h-2.5 w-2.5 ${accent}`} aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </MockShell>
  );
}

function OrbitCard({
  children,
  x,
  y,
  z,
  rotateX = 0,
  rotateY = 0,
  floatClass,
  blur = 0,
  opacity = 1,
  zIndex,
  parallax,
  parallaxStrength = 1,
  className = "",
  enterDelay = 0,
  interactive = false,
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  z: number;
  rotateX?: number;
  rotateY?: number;
  floatClass: string;
  blur?: number;
  opacity?: number;
  zIndex: number;
  parallax: Tilt;
  parallaxStrength?: number;
  className?: string;
  enterDelay?: number;
  interactive?: boolean;
}) {
  const px = parallax.x * 22 * parallaxStrength;
  const py = parallax.y * 16 * parallaxStrength;
  const tiltX = rotateX + parallax.y * -5;
  const tiltY = rotateY + parallax.x * 5;

  return (
    <div
      className={`bf-home-orbit-card absolute left-1/2 top-1/2 ${interactive ? "pointer-events-auto" : "pointer-events-none"} ${className}`}
      style={{
        zIndex,
        opacity,
        animationDelay: `${enterDelay}s`,
        transform: `translate(-50%, -50%) translate3d(calc(${x} + ${px}px), calc(${y} + ${py}px), ${z}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      }}
    >
      <div className={floatClass} style={{ filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
        {children}
      </div>
    </div>
  );
}

const DEMO_PROFILE: LandingShowcaseProfile = {
  id: "demo",
  username: "creator",
  display_name: "Creator",
  avatar_url: null,
  bio: "Building on cried.bio",
  sort_order: 0,
};

export function HomeHeroShowcase({
  profiles,
  variant = "default",
}: {
  profiles: LandingShowcaseProfile[];
  variant?: "default" | "split";
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });

  const profile = useMemo(() => {
    const valid = profiles.filter((item) => item.username);
    return valid[0] ?? DEMO_PROFILE;
  }, [profiles]);

  const musicTitle = profile.music_title?.trim() || "Midnight Drive";
  const views = profile.view_count ?? 2400;

  const rigRotateX = tilt.y * -5;
  const rigRotateY = tilt.x * 5;

  const isSplit = variant === "split";

  return (
    <div
      ref={stageRef}
      className={`bf-home-orbit-stage relative mx-auto w-full overflow-visible ${
        isSplit
          ? "bf-home-orbit-stage--split h-[19rem] min-w-0 max-w-[40.625rem] sm:h-[22rem] lg:mx-0 lg:ml-auto lg:h-[min(calc(100svh-7.5rem),32rem)] lg:max-w-[min(100%,40.625rem)] lg:min-w-[31.25rem]"
          : "h-[22rem] max-w-5xl sm:h-[26rem] md:h-[32rem] lg:h-[34rem]"
      }`}
      onMouseMove={(event) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTilt({
          x: (event.clientX - rect.left) / rect.width - 0.5,
          y: (event.clientY - rect.top) / rect.height - 0.5,
        });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div aria-hidden className="bf-home-orbit-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="bf-home-orbit-floor pointer-events-none absolute inset-x-0 bottom-[8%] mx-auto h-32 w-[min(90%,28rem)]" />

      <div
        className="bf-home-orbit-rig absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotateX(${rigRotateX}deg) rotateY(${rigRotateY}deg)` }}
      >
        <div className="bf-home-orbit-rig-inner relative h-full w-full max-w-[44rem]">
          <OrbitCard
            x="0rem"
            y="0rem"
            z={90}
            rotateX={-2}
            rotateY={2}
            floatClass="bf-home-hero-float-hero"
            zIndex={50}
            parallax={tilt}
            parallaxStrength={0.35}
            enterDelay={0.1}
            interactive
          >
            <ProfileCardMock profile={profile} />
          </OrbitCard>

          <OrbitCard
            x="-12rem"
            y="-6.5rem"
            z={55}
            rotateX={-10}
            rotateY={16}
            floatClass="bf-home-hero-float-a"
            zIndex={42}
            parallax={tilt}
            enterDelay={0.18}
          >
            <MusicPlayerMock title={musicTitle} />
          </OrbitCard>

          <OrbitCard
            x="12.5rem"
            y="-5.5rem"
            z={50}
            rotateX={-6}
            rotateY={-14}
            floatClass="bf-home-hero-float-b"
            zIndex={41}
            parallax={tilt}
            enterDelay={0.24}
          >
            <DiscordWidgetMock />
          </OrbitCard>

          <OrbitCard
            x="-13rem"
            y="5rem"
            z={35}
            rotateX={6}
            rotateY={12}
            floatClass="bf-home-hero-float-c"
            blur={0.4}
            opacity={0.92}
            zIndex={30}
            parallax={tilt}
            parallaxStrength={1.2}
            enterDelay={0.3}
            className="hidden md:block"
          >
            <SocialLinksMock />
          </OrbitCard>

          <OrbitCard
            x="11.5rem"
            y="5.5rem"
            z={38}
            rotateX={5}
            rotateY={-11}
            floatClass="bf-home-hero-float-d"
            blur={0.3}
            zIndex={32}
            parallax={tilt}
            parallaxStrength={1.1}
            enterDelay={0.36}
            className="hidden md:block"
          >
            <AnalyticsMock views={views} />
          </OrbitCard>

          <OrbitCard
            x="-8rem"
            y="9.5rem"
            z={28}
            rotateX={10}
            rotateY={8}
            floatClass="bf-home-float-ui-e"
            blur={0.6}
            opacity={0.88}
            zIndex={24}
            parallax={tilt}
            parallaxStrength={1.35}
            enterDelay={0.42}
            className="hidden lg:block"
          >
            <GuestbookMock />
          </OrbitCard>

          <OrbitCard
            x="9rem"
            y="10rem"
            z={32}
            rotateX={8}
            rotateY={-9}
            floatClass="bf-home-float-ui-f"
            blur={0.5}
            opacity={0.9}
            zIndex={26}
            parallax={tilt}
            parallaxStrength={1.25}
            enterDelay={0.48}
            className="hidden lg:block"
          >
            <BackgroundSelectorMock />
          </OrbitCard>

          <OrbitCard
            x="0rem"
            y="-10.5rem"
            z={48}
            rotateX={-12}
            rotateY={4}
            floatClass="bf-home-float-ui-a"
            zIndex={38}
            parallax={tilt}
            parallaxStrength={0.9}
            enterDelay={0.54}
            className="hidden md:block"
          >
            <BadgeComponentMock />
          </OrbitCard>
        </div>
      </div>
    </div>
  );
}
