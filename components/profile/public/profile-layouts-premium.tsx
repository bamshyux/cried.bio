"use client";

import { BadgeRow } from "@/components/badges/badge-ui";
import { resolveLayoutLabel } from "@/lib/layout-labels";
import { ProfileBio } from "./profile-bio";
import { ProfileAvatar, ProfileHandle, ProfileMainContent, ProfileMeta, Username, getDisplayName, getLayoutBadges, type LayoutProps } from "./layout-primitives";

function HeaderIdentity({ className, ...props }: LayoutProps & { className?: string }) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <>
      <div className={`bf-profile-name-row ${className ?? ""}`.trim()}>
        <Username name={displayName} settings={settings} profile={profile} />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <ProfileHandle profile={profile} className="mt-1" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mt-2" />
    </>
  );
}

function MonarchLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;
  const year = new Date(profile.created_at).getFullYear();

  return (
    <div className="w-full bf-layout-monarch relative w-full overflow-hidden border border-[#c9a84c]/45 shadow-[0_0_60px_rgba(201,168,76,0.14),inset_0_1px_0_rgba(255,236,179,0.12)]">
      <div className="bf-layout-monarch-shimmer pointer-events-none absolute inset-x-0 top-0 h-[2px]" />
      <div className="bf-layout-monarch-corner pointer-events-none absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-[#e8d5a3]/50" />
      <div className="bf-layout-monarch-corner pointer-events-none absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-[#e8d5a3]/50" />
      <div className="bf-layout-monarch-corner pointer-events-none absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-[#e8d5a3]/35" />
      <div className="bf-layout-monarch-corner pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-[#e8d5a3]/35" />

      <div
        className="relative overflow-hidden px-6 pb-2 pt-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.22), transparent 70%), linear-gradient(180deg, rgba(201,168,76,0.1), transparent 55%)",
        }}
      >
        <div className="bf-layout-monarch-sparkles pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d5a3]/50 bg-gradient-to-b from-[#c9a84c]/25 to-[#8b6914]/10 text-lg shadow-[0_0_24px_rgba(201,168,76,0.35)]">
          ♛
        </div>
        <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.55em] text-[#e8d5a3]">Royal Profile</p>
        <p className="mt-1 text-[10px] tracking-[0.35em] text-neutral-500">Member since {year}</p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#c9a84c]/70 to-transparent" />
      </div>

      <div className="relative px-6 pb-8 pt-2 text-center">
        <div className="bf-profile-avatar-row relative mb-6 flex justify-center">
          <div
            className="pointer-events-none absolute inset-0 mx-auto h-28 w-28 rounded-full opacity-80 blur-xl"
            style={{ background: `radial-gradient(circle, ${accent}55, transparent 70%)` }}
          />
          <div className="relative rounded-full p-[3px] shadow-[0_0_32px_rgba(201,168,76,0.35)]" style={{ background: "linear-gradient(135deg, #f5e6b8, #c9a84c, #8b6914, #f5e6b8)" }}>
            <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="h-24 w-24 ring-2 ring-[#090909]/80" />
          </div>
        </div>
        <HeaderIdentity {...props} className="justify-center" />
        <div className="bf-profile-block mx-auto mt-5 max-w-md border-t border-[#c9a84c]/15 pt-5">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function GlitchLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full bf-layout-glitch-active relative w-full overflow-hidden border border-[#ff0080]/20">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
        }}
      />
      <div className="bf-layout-glitch-scanline pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-[#00dfd8]/20 via-white/10 to-transparent opacity-60" />
      <div className="relative px-6 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#ff0080]">ERR://RENDER</p>
        <div className="bf-profile-avatar-row mt-4 flex items-end gap-4">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20 ring-2 ring-[#ff0080]/30" />
          <div className="relative min-w-0">
            <Username name={displayName} settings={settings} profile={profile} className="relative z-10 text-2xl font-black text-white" />
            <span className="absolute left-0.5 top-0.5 -z-0 truncate text-2xl font-black text-[#ff0080]/70" aria-hidden>{displayName}</span>
            <span className="absolute -left-0.5 top-0.5 -z-0 truncate text-2xl font-black text-[#00dfd8]/70" aria-hidden>{displayName}</span>
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
        </div>
        <ProfileHandle profile={profile} className="mt-2" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mt-2" />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function NoirLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full bg-black px-6 py-10" style={{ borderRadius: settings.border_radius }}>
      <div className="mx-auto mb-6 h-1 max-w-xs bg-white/80" />
      <div className="text-center">
        <Username name={displayName} settings={settings} profile={profile} className="font-serif text-4xl italic tracking-tight text-white" />
        <ProfileHandle profile={profile} className="mt-2 text-white/50" />
        <div className="bf-profile-avatar-row my-6 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#fafafa" className="h-20 w-20 grayscale" />
        </div>
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mt-2 justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md text-left">
          <ProfileMainContent {...props} />
        </div>
      </div>
      <div className="mx-auto mt-8 h-1 max-w-xs bg-white/80" />
    </div>
  );
}

function RunwayLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full grid w-full md:grid-cols-[6px_1fr]">
      <div className="hidden md:block" style={{ background: `linear-gradient(180deg, ${settings.accent_color}, ${settings.gradient_colors?.[1] ?? settings.accent_color})` }} />
      <div className="p-6 sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-neutral-500">Collection</p>
        <div className="mt-4 flex flex-wrap items-end gap-5 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-24 w-24" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function ArcadeLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full bf-layout-arcade-glow w-full overflow-hidden border-4 border-[#6366f1]/50 bg-[#0a0820]" style={{ borderRadius: Math.min(settings.border_radius, 8) }}>
      <div className="border-b-4 border-[#6366f1]/40 bg-[#6366f1]/20 px-4 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#c7d2fe]">
        Insert Coin · Player 1
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16 rounded-md shadow-[0_0_16px_rgba(99,102,241,0.45)]" rounded="rounded-md" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function PassportLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const label = resolveLayoutLabel(settings) || "VISITOR";

  return (
    <div className="w-full mx-auto w-full max-w-lg border-2 border-[#1e3a5f]/60 bg-[#0c1420]" style={{ borderRadius: settings.border_radius }}>
      <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#60a5fa]">{label}</p>
        <div className="h-8 w-8 rounded-full border-2 border-dashed border-[#60a5fa]/50" />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-28 w-28 shrink-0" rounded="rounded-md" />
        <HeaderIdentity {...props} />
      </div>
      <ProfileMainContent {...props} />
    </div>
  );
}

function CassetteLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const label = resolveLayoutLabel(settings) || "Side A";

  return (
    <div className="w-full overflow-hidden border-2 border-[#2a2a2a] bg-[#121212] shadow-[inset_0_2px_0_rgba(255,255,255,0.04)]" style={{ borderRadius: settings.border_radius }}>
      <div className="border-b border-[#2a2a2a] bg-[#0c0c0c] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#f97316]/90">Compact Cassette</p>
            <p className="mt-1 font-mono text-base font-semibold uppercase tracking-wide text-neutral-200">{label}</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/80" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="relative overflow-hidden rounded-xl border border-[#333] bg-[#1a1a1a] p-4 shadow-inner">
          <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-[#444] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
          <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#444] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
          <div className="bf-layout-cassette-window relative flex items-center justify-between gap-5 rounded-lg border border-[#2f2f2f] bg-[#0a0a0a] px-5 py-5">
            <div className="bf-layout-cassette-reel relative h-14 w-14 shrink-0 rounded-full border-2 border-[#555] bg-[#151515] shadow-inner sm:h-16 sm:w-16">
              <div className="absolute inset-2.5 rounded-full border border-[#333]" />
              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#666]" />
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">Now playing</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold uppercase tracking-wider text-[#f97316]">{displayName}</p>
              <div className="mx-auto mt-3 flex h-8 max-w-[140px] items-end justify-center gap-1">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="bf-layout-cassette-vu w-1 rounded-sm bg-[#f97316]/80"
                    style={{ height: `${10 + (index % 4) * 5}px`, animationDelay: `${index * 0.07}s` }}
                  />
                ))}
              </div>
            </div>
            <div className="bf-layout-cassette-reel relative h-14 w-14 shrink-0 rounded-full border-2 border-[#555] bg-[#151515] shadow-inner sm:h-16 sm:w-16 [animation-direction:reverse]">
              <div className="absolute inset-2.5 rounded-full border border-[#333]" />
              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#666]" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
          <ProfileAvatar
            profile={profile}
            displayName={displayName}
            accentColor={settings.accent_color}
            className="h-20 w-20 shrink-0 ring-2 ring-[#444] sm:h-24 sm:w-24"
          />
          <div className="flex min-w-0 w-full flex-1 flex-col items-center sm:items-start">
            <HeaderIdentity {...props} className="mx-auto flex-wrap items-center gap-x-2 gap-y-1.5 sm:mx-0" />
          </div>
        </div>
      </div>

      <div className="border-t border-[#2a2a2a] px-6 pb-8 pt-6">
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function CrystalLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;

  return (
    <div className="w-full relative w-full overflow-hidden border border-white/10 shadow-[0_0_32px_rgba(147,197,253,0.12)]">
      <div
        className="relative px-6 py-10 text-center"
        style={{
          background: `linear-gradient(135deg, ${accent}44 0%, transparent 45%, ${settings.gradient_colors?.[1] ?? accent}33 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
        }}
      >
        <div className="bf-layout-crystal-shine" />
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="relative z-10 mx-auto h-24 w-24 ring-2 ring-white/30" />
      </div>
      <div className="px-6 pb-8 pt-2 text-center">
        <HeaderIdentity {...props} className="justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function NebuladriftLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#6366f1]/20">
      <div
        className="bf-layout-nebula-layer absolute inset-x-0 top-0 h-44"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${settings.accent_color}66, transparent 55%), radial-gradient(ellipse at 70% 40%, #a855f788, transparent 50%)`,
        }}
      />
      <div
        className="bf-layout-nebula-layer-delay absolute inset-x-0 top-0 h-44"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, #6366f155, transparent 60%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-40">
        {["12%", "28%", "44%", "61%", "78%", "90%"].map((left, index) => (
          <span
            key={left}
            className="absolute h-1 w-1 rounded-full bg-white/80"
            style={{ left, top: `${18 + (index % 3) * 22}%`, opacity: 0.35 + (index % 3) * 0.2 }}
          />
        ))}
      </div>
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="mx-auto h-24 w-24 ring-2 ring-[#a855f7]/40 shadow-[0_0_24px_rgba(168,85,247,0.25)]" />
        <HeaderIdentity {...props} className="mt-4 justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function SamuraiLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full grid w-full md:grid-cols-[1fr_6px]">
      <div className="p-6 sm:p-8">
        <p className="font-serif text-[10px] uppercase tracking-[0.4em] text-[#dc2626]">武士</p>
        <div className="mt-4 flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
      <div className="hidden bg-gradient-to-b from-[#dc2626] via-[#7f1d1d] to-[#450a0a] md:block" />
    </div>
  );
}

function GraffitiLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full overflow-hidden">
      <div
        className="relative overflow-visible px-5 py-6 sm:px-6"
        style={{ background: `linear-gradient(135deg, ${settings.accent_color}55 0%, transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.15), transparent)` }}
      >
        <div className="pointer-events-none absolute -left-1 bottom-3 h-20 w-3 rotate-12 rounded-full bg-[#f472b6]/75 blur-[0.5px]" />
        <div className="pointer-events-none absolute bottom-1 right-4 h-24 w-2.5 -rotate-6 rounded-full bg-[#22d3ee]/70 blur-[0.5px]" />
        <div className="pointer-events-none absolute right-12 top-4 h-3 w-10 rotate-[8deg] rounded-sm bg-[#fde047]/80" />
        <div className="relative min-w-0">
          <div className="bf-profile-name-row flex-wrap items-center gap-x-2 gap-y-1">
            <Username
              name={displayName}
              settings={settings}
              profile={profile}
              className="max-w-full break-words text-3xl font-black uppercase italic leading-tight text-white sm:text-4xl"
            />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} className="relative mt-2" />
        </div>
      </div>
      <div className="px-5 pb-8 sm:px-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function MonolithLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;

  return (
    <div className="w-full relative mx-auto w-full max-w-sm overflow-hidden border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]" style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      }}>
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative px-6 py-10 text-center">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.55em] text-neutral-500">Monolith</p>
        <div className="relative mx-auto mb-6 flex justify-center">
          <div
            className="pointer-events-none absolute bottom-0 h-3 w-20 rounded-full blur-md"
            style={{ background: `${accent}44` }}
          />
          <div
            className="relative rounded-2xl px-6 py-5 shadow-[0_0_40px_rgba(255,255,255,0.04)]"
            style={{
              background: `linear-gradient(180deg, ${accent}18, rgba(255,255,255,0.02))`,
              border: `1px solid ${accent}33`,
            }}
          >
            <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="mx-auto h-28 w-28 ring-2 ring-white/10" />
          </div>
        </div>
        <HeaderIdentity {...props} className="justify-center" />
        <div className="bf-profile-block mt-6 border-t border-white/[0.06] pt-6">
          <ProfileMainContent {...props} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function PrismstackLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const colors = [settings.accent_color, settings.gradient_colors?.[1] ?? "#6366f1", "#22c55e", "#f97316"];

  return (
    <div className="w-full overflow-hidden">
      <div className="bf-layout-prism-animate flex h-3 shadow-[0_4px_20px_rgba(255,255,255,0.08)]">
        {colors.map((color) => (
          <div key={color} className="flex-1" style={{ background: color }} />
        ))}
      </div>
      <div className="p-6">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function DashboardLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;
  const modules = ["Identity", "Links", "Media"];

  return (
    <div className="w-full overflow-hidden border border-white/[0.08]">
      <div className="bf-layout-studio-grid relative border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-neutral-500">Creative Studio</p>
            <p className="mt-1 text-sm font-medium text-white">Profile workspace</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/80" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {modules.map((module, index) => (
            <span
              key={module}
              className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider ${
                index === 0
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "border-white/[0.08] bg-white/[0.03] text-neutral-500"
              }`}
              style={index === 0 ? { boxShadow: `0 0 18px ${accent}22` } : undefined}
            >
              {module}
            </span>
          ))}
        </div>
        <div className="bf-layout-studio-accent pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl opacity-60 blur-md" style={{ background: `${accent}33` }} />
            <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="relative h-16 w-16 ring-2 ring-white/10" />
          </div>
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function CommandLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const label = resolveLayoutLabel(settings) || "cried-ops";

  return (
    <div className="w-full bf-layout-command relative w-full overflow-hidden border border-[#22c55e]/30 bg-[#030a04] font-mono shadow-[0_0_40px_rgba(34,197,94,0.08)]" style={{ borderRadius: settings.border_radius }}>
      <div className="bf-layout-command-scanline pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-[#22c55e]/10 via-transparent to-transparent opacity-50" />
      <div className="relative flex items-center justify-between border-b border-[#22c55e]/20 bg-[#041208] px-4 py-2.5 text-[10px] uppercase tracking-[0.25em] text-[#22c55e]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e]" />
          <span>{label} // shell</span>
        </div>
        <span className="text-[#22c55e]/60">secure</span>
      </div>
      <div className="relative space-y-1 border-b border-[#22c55e]/10 px-4 py-3 text-[11px] text-[#22c55e]/75">
        <p><span className="text-[#22c55e]">$</span> profile.load --user {profile.username ?? "guest"}</p>
        <p><span className="text-[#22c55e]">$</span> status.render --mode public<span className="bf-layout-command-cursor ml-0.5 inline-block h-3 w-1.5 bg-[#22c55e]" /></p>
      </div>
      <div className="relative p-5">
        <div className="mb-4 rounded-lg border border-[#22c55e]/15 bg-[#041208]/80 p-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#22c55e]/60">[ operator ]</p>
          <div className="mt-3 flex gap-4 bf-profile-avatar-row">
            <ProfileAvatar profile={profile} displayName={displayName} accentColor="#22c55e" className="h-16 w-16 ring-1 ring-[#22c55e]/40" />
            <HeaderIdentity {...props} />
          </div>
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function BloomLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#f472b6]/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ background: `${accent}44` }} />
      {[
        { className: "left-[12%] top-[18%] h-3 w-3", delay: "0s" },
        { className: "right-[16%] top-[24%] h-2.5 w-2.5", delay: "1.2s" },
        { className: "left-[20%] bottom-[22%] h-2 w-2", delay: "2.1s" },
      ].map((petal) => (
        <div
          key={petal.className}
          className={`bf-layout-bloom-petal pointer-events-none absolute rounded-full ${petal.className}`}
          style={{ background: `${accent}88`, animationDelay: petal.delay }}
        />
      ))}
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="mx-auto h-24 w-24 ring-2 ring-[#f472b6]/30" />
        <HeaderIdentity {...props} className="mt-4 justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function StealthLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#14532d]/40 bg-[#030303] p-5" style={{ borderRadius: settings.border_radius }}>
      <div className="bf-layout-stealth-scan pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#4ade80]/15 to-transparent" />
      <div className="relative flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#4ade80]/80">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
        Stealth mode
      </div>
      <div className="relative mt-4 flex gap-4 bf-profile-avatar-row">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor="#4ade80" className="h-16 w-16 opacity-90 ring-1 ring-[#4ade80]/30" />
        <HeaderIdentity {...props} />
      </div>
      <ProfileMainContent {...props} />
    </div>
  );
}

function FestivalLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const label = resolveLayoutLabel(settings) || "ALL ACCESS";

  return (
    <div className="w-full relative mx-auto w-full max-w-md overflow-hidden">
      <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-[#090909]" />
      <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-[#090909]" />
      <div className="border-b border-dashed border-white/15 px-6 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: settings.accent_color }}>{label}</p>
      </div>
      <div className="p-6 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="mx-auto h-20 w-20" />
        <HeaderIdentity {...props} className="mt-4 justify-center" />
        <div className="bf-profile-block mt-4">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function MangaLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full border-4 border-white bg-[#fafafa] text-black" style={{ borderRadius: Math.min(settings.border_radius, 4) }}>
      <div className="border-b-4 border-black p-5">
        <Username name={displayName} settings={settings} profile={profile} className="text-3xl font-black uppercase text-black" />
        <ProfileHandle profile={profile} className="text-black/60" />
      </div>
      <div className="p-5">
        {profile.bio ? (
          <div className="relative mb-4 rounded-2xl border-2 border-black bg-white px-4 py-3 after:absolute after:-bottom-2 after:left-8 after:h-4 after:w-4 after:rotate-45 after:border-b-2 after:border-r-2 after:border-black after:bg-white">
            <ProfileBio text={profile.bio} settings={settings} className="!mb-0 text-black" />
          </div>
        ) : null}
        <HeaderIdentity {...props} />
        <ProfileMainContent {...props} hideBio />
      </div>
    </div>
  );
}

function EmberforgeLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#ea580c]/35">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28">
        {[18, 34, 52, 68, 81].map((left, index) => (
          <span
            key={left}
            className="bf-layout-ember-particle absolute bottom-0 h-2 w-2 rounded-full bg-[#fb923c]"
            style={{ left: `${left}%`, animationDelay: `${index * 0.45}s` }}
          />
        ))}
      </div>
      <div
        className="relative border-b border-[#ea580c]/25 px-6 py-5"
        style={{ background: "linear-gradient(180deg, rgba(234,88,12,0.24), transparent)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#fb923c]">Forge Online</p>
        <div className="mt-3 flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#ea580c" className="h-20 w-20 ring-2 ring-[#fb923c]/35 shadow-[0_0_20px_rgba(251,146,60,0.25)]" />
          <HeaderIdentity {...props} />
        </div>
      </div>
      <div className="p-6">
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function MatrixLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#22c55e]/25 bg-[#020802] font-mono" style={{ borderRadius: settings.border_radius }}>
      <div className="bf-layout-matrix-rain relative h-28 border-b border-[#22c55e]/20 px-6 py-4">
        <p className="relative z-10 text-[10px] uppercase tracking-[0.35em] text-[#22c55e]">System Access</p>
        <ProfileAvatar profile={profile} displayName={displayName} accentColor="#22c55e" className="relative z-10 mt-3 h-16 w-16 ring-1 ring-[#22c55e]/40" />
      </div>
      <div className="p-5">
        <HeaderIdentity {...props} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function LiquidLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;

  return (
    <div className="w-full relative w-full overflow-hidden">
      <div
        className="bf-layout-liquid-blob pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 opacity-50 blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent}, ${settings.gradient_colors?.[1] ?? accent})` }}
      />
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="mx-auto h-24 w-24 ring-2 ring-white/15" />
        <HeaderIdentity {...props} className="mt-4 justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function SupernovaLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const accent = settings.accent_color;

  return (
    <div className="w-full relative w-full overflow-hidden border border-white/10">
      <div
        className="bf-layout-supernova-core pointer-events-none absolute left-1/2 top-10 h-36 w-36 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="mx-auto h-24 w-24 shadow-[0_0_30px_rgba(255,255,255,0.18)]" />
        <HeaderIdentity {...props} className="mt-4 justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function TapewaveLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full overflow-hidden border border-[#38bdf8]/25 bg-[#071018]" style={{ borderRadius: settings.border_radius }}>
      <div className="flex h-16 items-end gap-1 border-b border-[#38bdf8]/20 px-5 py-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="bf-layout-wave-bar w-1.5 rounded-full bg-[#38bdf8]/80"
            style={{ height: `${18 + (index % 4) * 10}px`, animationDelay: `${index * 0.08}s` }}
          />
        ))}
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#38bdf8" className="h-16 w-16" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function PhoenixLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full relative w-full overflow-hidden border border-[#f97316]/30 shadow-[0_0_50px_rgba(249,115,22,0.12)]">
      <div
        className="bf-layout-phoenix-aura pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.45), rgba(234,88,12,0.15) 45%, transparent 70%)" }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2">
        <div className="bf-layout-phoenix-wing-left h-24 w-16 -rotate-[28deg] rounded-[999px] bg-gradient-to-br from-[#ea580c] via-[#fb923c] to-transparent opacity-80 [transform-origin:bottom_center]" />
        <div className="bf-layout-phoenix-wing-right h-24 w-16 rotate-[28deg] rounded-[999px] bg-gradient-to-bl from-[#f97316] via-[#fdba74] to-transparent opacity-80 [transform-origin:bottom_center]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center gap-8">
        {[12, 28, 44, 60, 76].map((left, index) => (
          <span
            key={left}
            className="bf-layout-phoenix-ember absolute h-1.5 w-1.5 rounded-full bg-[#fde68a]"
            style={{ left: `${left}%`, animationDelay: `${index * 0.35}s` }}
          />
        ))}
      </div>
      <div className="relative px-6 pb-10 pt-12 text-center">
        <div className="relative mx-auto mb-5 flex justify-center">
          <div className="absolute inset-0 mx-auto h-28 w-28 animate-pulse rounded-full bg-[#fb923c]/20 blur-xl" />
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#f97316" className="relative h-24 w-24 ring-2 ring-[#fb923c]/50 shadow-[0_0_30px_rgba(251,146,60,0.35)]" />
        </div>
        <HeaderIdentity {...props} className="justify-center" />
        <div className="bf-profile-block mx-auto mt-5 max-w-md border-t border-[#f97316]/15 pt-5">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

export const PREMIUM_LAYOUTS = {
  monarch: MonarchLayout,
  glitch: GlitchLayout,
  noir: NoirLayout,
  runway: RunwayLayout,
  arcade: ArcadeLayout,
  passport: PassportLayout,
  cassette: CassetteLayout,
  crystal: CrystalLayout,
  nebuladrift: NebuladriftLayout,
  samurai: SamuraiLayout,
  graffiti: GraffitiLayout,
  monolith: MonolithLayout,
  prismstack: PrismstackLayout,
  dashboard: DashboardLayout,
  command: CommandLayout,
  bloom: BloomLayout,
  stealth: StealthLayout,
  festival: FestivalLayout,
  manga: MangaLayout,
  emberforge: EmberforgeLayout,
  matrix: MatrixLayout,
  liquid: LiquidLayout,
  supernova: SupernovaLayout,
  tapewave: TapewaveLayout,
  phoenix: PhoenixLayout,
} as const;
