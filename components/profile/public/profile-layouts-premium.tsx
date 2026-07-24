"use client";

import { BadgeRow } from "@/components/badges/badge-ui";
import { resolveLayoutLabel } from "@/lib/layout-labels";
import { ProfileBio } from "./profile-bio";
import {
  ProfileAvatar,
  ProfileHandle,
  ProfileMainContent,
  ProfileMeta,
  Username,
  buildCardStyle,
  getDisplayName,
  getLayoutBadges,
  type LayoutProps,
} from "./layout-primitives";

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

  return (
    <div className="w-full overflow-hidden border border-[#d4af37]/25" style={buildCardStyle(settings)}>
      <div
        className="border-b border-[#d4af37]/20 px-6 py-4 text-center"
        style={{ background: `linear-gradient(180deg, ${accent}18, transparent)` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#d4af37]">Monarch</p>
        <p className="mt-1 text-xs text-neutral-500">Est. {new Date(profile.created_at).getFullYear()}</p>
      </div>
      <div className="px-6 py-8 text-center">
        <div className="bf-profile-avatar-row mb-5 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="h-24 w-24 ring-2 ring-[#d4af37]/40" />
        </div>
        <HeaderIdentity {...props} className="justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
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
    <div className="relative w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />
      <div className="relative px-6 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#ff0080]">ERR://RENDER</p>
        <div className="bf-profile-avatar-row mt-4 flex items-end gap-4">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
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
    <div className="grid w-full md:grid-cols-[6px_1fr]" style={buildCardStyle(settings)}>
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
    <div className="w-full overflow-hidden border-4 border-[#6366f1]/40" style={{ ...buildCardStyle(settings), borderRadius: Math.min(settings.border_radius, 8) }}>
      <div className="border-b-4 border-[#6366f1]/40 bg-[#6366f1]/15 px-4 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#c7d2fe]">
        Insert Coin · Player 1
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16 rounded-md" rounded="rounded-md" />
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
    <div className="mx-auto w-full max-w-lg border-2 border-[#1e3a5f]/60 bg-[#0c1420]" style={{ borderRadius: settings.border_radius }}>
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
    <div className="w-full overflow-hidden border border-white/10 bg-[#141414]" style={{ borderRadius: settings.border_radius }}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
        <div className="flex gap-2">
          <div className="h-6 w-6 rounded-full border-2 border-white/20 bg-[#0a0a0a]" />
          <div className="h-6 w-6 rounded-full border-2 border-white/20 bg-[#0a0a0a]" />
        </div>
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16" />
          <HeaderIdentity {...props} />
        </div>
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
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div
        className="px-6 py-10 text-center"
        style={{
          background: `linear-gradient(135deg, ${accent}33 0%, transparent 45%, ${settings.gradient_colors?.[1] ?? accent}22 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
        }}
      >
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={accent} className="mx-auto h-24 w-24 ring-2 ring-white/20" />
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
    <div className="relative w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div
        className="absolute inset-x-0 top-0 h-40 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${settings.accent_color}55, transparent 55%), radial-gradient(ellipse at 70% 40%, #a855f766, transparent 50%), radial-gradient(ellipse at 50% 80%, #6366f144, transparent 60%)`,
        }}
      />
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="mx-auto h-24 w-24" />
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
    <div className="grid w-full md:grid-cols-[1fr_6px]" style={buildCardStyle(settings)}>
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
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="relative px-6 py-8" style={{ background: `linear-gradient(180deg, ${settings.accent_color}44, transparent)` }}>
        <div className="absolute bottom-0 left-4 h-16 w-1 rotate-12 rounded-full bg-[#f472b6]/80 blur-[1px]" />
        <div className="absolute bottom-2 right-8 h-20 w-2 -rotate-6 rounded-full bg-[#22d3ee]/70 blur-[1px]" />
        <Username name={displayName} settings={settings} profile={profile} className="relative text-4xl font-black uppercase italic text-white" />
        <ProfileHandle profile={profile} className="relative mt-1" />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <div className="px-6 pb-8">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function MonolithLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="mx-auto w-full max-w-sm py-4" style={buildCardStyle(settings)}>
      <div className="px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="mx-auto h-28 w-28" />
        <HeaderIdentity {...props} className="mt-5 justify-center" />
        <div className="bf-profile-block mt-6">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function PrismstackLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);
  const colors = [settings.accent_color, settings.gradient_colors?.[1] ?? "#6366f1", "#22c55e", "#f97316"];

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="flex h-2">
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
  const { profile, settings, viewCount } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="w-full" style={buildCardStyle(settings)}>
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-4">
        {[
          { label: "Views", value: viewCount.toLocaleString() },
          { label: "Links", value: String(props.links.length) },
          { label: "Status", value: "Live" },
        ].map((tile) => (
          <div key={tile.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
            <p className="text-[9px] uppercase tracking-wider text-neutral-500">{tile.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{tile.value}</p>
          </div>
        ))}
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16" />
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
  const label = resolveLayoutLabel(settings) || "OPS-ACTIVE";

  return (
    <div className="w-full border border-[#22c55e]/25 bg-[#050805] font-mono" style={{ borderRadius: settings.border_radius }}>
      <div className="flex items-center gap-2 border-b border-[#22c55e]/20 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#22c55e]">
        <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
        {label}
      </div>
      <div className="p-5">
        <div className="flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#22c55e" className="h-16 w-16" />
          <HeaderIdentity {...props} />
        </div>
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function BloomLayout(props: LayoutProps) {
  const { profile, settings } = props;
  const displayName = getDisplayName(profile);

  return (
    <div className="relative w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: `${settings.accent_color}33` }}
      />
      <div className="relative px-6 py-10 text-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="mx-auto h-24 w-24" />
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
    <div className="w-full border border-[#14532d]/40 bg-[#030303] p-5" style={{ borderRadius: settings.border_radius }}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#4ade80]/80">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
        Stealth mode
      </div>
      <div className="mt-4 flex gap-4 bf-profile-avatar-row">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor="#4ade80" className="h-16 w-16 opacity-90" />
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
    <div className="relative mx-auto w-full max-w-md overflow-hidden" style={buildCardStyle(settings)}>
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
    <div className="w-full overflow-hidden border border-[#ea580c]/30" style={buildCardStyle(settings)}>
      <div
        className="border-b border-[#ea580c]/25 px-6 py-5"
        style={{ background: "linear-gradient(180deg, rgba(234,88,12,0.18), transparent)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#fb923c]">Forge Online</p>
        <div className="mt-3 flex gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor="#ea580c" className="h-20 w-20" />
          <HeaderIdentity {...props} />
        </div>
      </div>
      <div className="p-6">
        <ProfileMainContent {...props} />
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
} as const;
