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
  bannerTopRadius,
  buildCardStyle,
  getDisplayName,
  getLayoutBadges,
  getUsernameEffectClass,
  type LayoutProps,
} from "./layout-primitives";

function VaporwaveLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="bf-layout-vaporwave w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div
        className="relative px-6 py-8"
        style={{
          background: `linear-gradient(180deg, ${settings.accent_color}22 0%, transparent 55%), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px)`,
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff71ce]">{label}</p>
        <div className="-skew-x-6 mt-3 bf-profile-name-row">
          <Username name={displayName} settings={settings} profile={profile} className="text-4xl font-black italic tracking-tight text-white sm:text-5xl" />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-2 skew-x-6" />
      </div>
      <div className="h-1 bg-gradient-to-r from-[#ff71ce] via-[#01cdfe] to-[#05ffa1]" />
      <div className="px-6 py-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function BrutalistLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div
      className="w-full border-4 border-white bg-[#090909] p-0"
      style={{ borderRadius: Math.min(settings.border_radius, 4) }}
    >
      <div className="border-b-4 border-white px-6 py-8">
        <Username name={displayName} settings={settings} profile={profile} className="text-5xl font-black uppercase leading-[0.85] tracking-tighter text-white sm:text-6xl" />
        <ProfileHandle profile={profile} className="mt-3 text-white/60" />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <div className="px-6 py-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function NewspaperLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const date = new Date(profile.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="w-full border border-white/20 bg-[#0c0c0c] p-6 sm:p-8" style={{ borderRadius: settings.border_radius }}>
      <div className="border-b-2 border-white pb-3">
        <p className="text-center text-[10px] uppercase tracking-[0.35em] text-neutral-500">The Daily Profile · {date}</p>
        <Username name={displayName} settings={settings} profile={profile} className="mt-3 text-center font-serif text-4xl font-bold leading-tight text-white sm:text-5xl" />
        <ProfileHandle profile={profile} className="mt-2 text-center" />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <div className="mt-6 columns-1 gap-8 sm:columns-2">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        {profile.bio && (
          <ProfileBio
            text={profile.bio}
            settings={settings}
            className="mb-4 text-sm leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:text-4xl first-letter:font-serif first-letter:leading-none !mb-4"
          />
        )}
      </div>
      <div className="mt-4 border-t border-white/10 pt-6">
        <ProfileMainContent {...props} hideBio />
      </div>
    </div>
  );
}

function TicketLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden" style={buildCardStyle(settings)}>
      <div className="flex items-stretch border-b border-dashed border-white/15">
        <div className="min-w-0 flex-1 px-5 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-500">{label}</p>
          <div className="bf-profile-name-row mt-1">
            <Username name={displayName} settings={settings} profile={profile} className="text-xl font-bold text-white sm:text-2xl" />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} className="mt-0.5" />
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mb-0 mt-2" />
        </div>
        <div className="relative flex w-11 shrink-0 items-center justify-center border-l border-dashed border-white/20 bg-black/25 px-1">
          <div className="absolute -left-2 top-3 h-4 w-4 rounded-full bg-[#090909]" />
          <div className="absolute -left-2 bottom-3 h-4 w-4 rounded-full bg-[#090909]" />
          <span className="text-[8px] font-mono tracking-widest text-neutral-600 [writing-mode:vertical-rl] rotate-180">
            #{profile.uid ?? "0000"}
          </span>
        </div>
      </div>
      <div className="px-5 py-4">
        <ProfileMainContent {...props} hideBio />
      </div>
    </div>
  );
}

function VinylLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);
  const coverRadius = Math.max(settings.border_radius, 8);
  const coverStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${settings.gradient_colors.join(", ")})` };

  return (
    <div className="w-full p-6" style={buildCardStyle(settings)}>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div
          className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 overflow-hidden sm:mx-0"
          style={{ ...coverStyle, borderRadius: coverRadius }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-black/30 bg-black/40 backdrop-blur-sm" />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="truncate text-xs font-bold uppercase text-white drop-shadow">{displayName}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
          <div className="bf-profile-name-row mt-1">
            <Username name={displayName} settings={settings} profile={profile} />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} className="mt-1" />
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

function DiscordLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const bannerStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: settings.accent_color };

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="relative h-28 sm:h-32" style={bannerStyle}>
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="relative px-5 pb-6">
        <div className="-mt-10 mb-3 bf-profile-avatar-row flex items-end gap-3">
          <div className="relative">
            <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20 ring-4 ring-[#141414]" />
            <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-[3px] border-[#141414] bg-emerald-500" />
          </div>
          <div className="pb-1">
            <div className="bf-profile-name-row">
              <Username name={displayName} settings={settings} profile={profile} className="text-xl font-bold text-white" />
              <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} />
          </div>
        </div>
        {profile.bio && (
          <div className="mb-4 rounded-lg bg-[#0f0f0f] px-3 py-2 text-sm">
            <ProfileBio text={profile.bio} settings={settings} className="!mb-0" />
          </div>
        )}
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} hideBio />
      </div>
    </div>
  );
}

function TwitchLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="flex items-center gap-2 bg-[#9146ff]/20 px-4 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#bf94ff]">{label}</span>
      </div>
      <div className="flex gap-4 p-5 bf-profile-avatar-row">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor="#9146ff" className="h-16 w-16 shrink-0" />
        <div>
          <div className="bf-profile-name-row">
            <Username name={displayName} settings={settings} profile={profile} className="text-xl font-bold text-white" />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} className="text-[#adadb8]" />
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mb-0 mt-2" />
        </div>
      </div>
      <div className="border-t border-[#9146ff]/20 px-5 py-5">
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function IdcardLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);
  const cardRadius = Math.max(settings.border_radius, 10);

  return (
    <div
      className="mx-auto w-full max-w-md overflow-hidden border border-white/10"
      style={{ ...buildCardStyle(settings), borderRadius: cardRadius }}
    >
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-2.5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">{label}</p>
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
        <ProfileAvatar
          profile={profile}
          displayName={displayName}
          accentColor={settings.accent_color}
          className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
          rounded="rounded-lg"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <Username name={displayName} settings={settings} profile={profile} className="text-xl font-bold text-white" />
          <ProfileHandle profile={profile} />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mb-0 mt-2 justify-center sm:justify-start" />
        </div>
      </div>
      {profile.bio && (
        <div className="border-t border-white/10 px-5 py-3 text-center sm:text-left">
          <ProfileBio text={profile.bio} settings={settings} className="!mb-0 text-sm" />
        </div>
      )}
      <div className="flex h-7 items-end gap-px bg-black/40 px-5 pb-1.5" aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-px bg-white/30" style={{ height: `${6 + (i % 5) * 3}px` }} />
        ))}
      </div>
      <div className="px-5 py-4">
        <ProfileMainContent {...props} hideBio />
      </div>
    </div>
  );
}

function BlueprintLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div
      className="bf-layout-blueprint w-full border border-[#4a9eff]/40 p-6 font-mono text-[#b8d4ff]"
      style={{
        borderRadius: settings.border_radius,
        background: "#0a1628",
        backgroundImage: "linear-gradient(rgba(74,158,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,0.08) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-[#4a9eff]">
        Rev. {profile.uid ?? "001"} · {label}
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-4 bf-profile-avatar-row">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor="#4a9eff" className="h-16 w-16 shrink-0" />
        <div>
          <Username name={displayName} settings={settings} profile={profile} className="text-xl font-bold uppercase tracking-wide text-white" />
          <ProfileHandle profile={profile} className="text-[#4a9eff]/70" />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
      </div>
      <div className="mt-5 border border-dashed border-[#4a9eff]/30 p-4">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function ComicLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const outerRadius = Math.max(settings.border_radius, 12);
  const innerRadius = Math.max(outerRadius - 6, 4);

  return (
    <div
      className="w-full overflow-hidden bg-[#fef08a] p-1.5 text-black"
      style={{ borderRadius: outerRadius }}
    >
      <div
        className="overflow-hidden border-2 border-black bg-white p-5"
        style={{ borderRadius: innerRadius }}
      >
        <div className="flex flex-wrap items-start gap-4 bf-profile-avatar-row">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20 shrink-0 ring-2 ring-black" />
          <div>
            <Username
              name={displayName}
              settings={settings}
              profile={profile}
              className="text-3xl font-black uppercase italic leading-none text-black"
              suffix="!"
            />
            <ProfileHandle profile={profile} className="text-neutral-600" />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
        </div>
        {profile.bio && (
          <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-black bg-white px-4 py-3 after:absolute after:-bottom-2 after:left-8 after:h-4 after:w-4 after:rotate-45 after:border-b-2 after:border-r-2 after:border-black after:bg-white">
            <ProfileBio text={profile.bio} settings={settings} className="!mb-0 text-sm font-medium" />
          </div>
        )}
        <div className="mt-6 border-t-2 border-dashed border-black/20 pt-5 text-black [&_*]:text-inherit">
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
          <ProfileMainContent {...props} hideBio />
        </div>
      </div>
    </div>
  );
}

function CyberpunkLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="bf-layout-cyberpunk relative w-full overflow-hidden p-6" style={buildCardStyle(settings)}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bf-cyber-scanlines" />
      <div className="relative">
        <div className="flex items-stretch gap-2.5">
          <div className="w-1 shrink-0 rounded-sm" style={{ background: settings.accent_color }} />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-neutral-500">// {label}</p>
            <Username
              name={displayName}
              settings={settings}
              profile={profile}
              className={`mt-0.5 text-3xl font-black uppercase tracking-tight ${getUsernameEffectClass(settings.username_effect)}`}
              style={{ color: settings.accent_color, textShadow: `0 0 20px ${settings.accent_color}80` }}
            />
            <ProfileHandle profile={profile} className="font-mono" />
            <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
          </div>
        </div>
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function LuxuryLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="w-full px-8 py-10 text-center" style={buildCardStyle(settings)}>
      <div className="mx-auto mb-6 h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${settings.accent_color}, transparent)` }} />
      <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-neutral-500">{label}</p>
      <div className="bf-profile-avatar-row mt-6 flex justify-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
      </div>
      <div className="bf-profile-name-row mt-5">
        <Username name={displayName} settings={settings} profile={profile} className="font-serif text-3xl font-light tracking-wide text-white sm:text-4xl" />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <ProfileHandle profile={profile} className="mt-2" />
      <div className="mx-auto mb-6 mt-6 h-px w-24 bg-white/10" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="justify-center" />
      <div className="bf-profile-block mx-auto mt-2 max-w-md">
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function ReceiptLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const now = new Date().toLocaleString();

  return (
    <div className="mx-auto w-full max-w-xs bg-[#f5f0e6] px-5 py-6 font-mono text-[11px] text-[#1a1a1a] shadow-xl" style={{ borderRadius: 2 }}>
      <p className="text-center text-[10px] uppercase">cried.bio</p>
      <p className="mt-1 text-center text-[9px] text-neutral-500">{now}</p>
      <div className="my-3 border-t border-dashed border-neutral-400" />
      <p className="font-bold uppercase">{displayName}</p>
      <ProfileHandle profile={profile} className="text-neutral-600" />
      <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      <div className="my-3 border-t border-dashed border-neutral-400" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mb-3 text-neutral-600" />
      <div className="text-neutral-800 [&_*]:text-inherit">
        <ProfileMainContent {...props} />
      </div>
      <div className="my-3 border-t border-dashed border-neutral-400" />
      <p className="text-center text-[9px] uppercase">Thank you for visiting</p>
    </div>
  );
}

function ZineLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const label = resolveLayoutLabel(settings);

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="border-b-2 border-white/20 px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {label} #{profile.uid ?? "01"}
        </p>
        <Username name={displayName} settings={settings} profile={profile} className="mt-2 text-3xl font-black uppercase leading-tight text-white sm:text-4xl" />
        <ProfileHandle profile={profile} className="mt-2" />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <div className="px-6 py-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function OrbitLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full px-6 py-12 text-center" style={buildCardStyle(settings)}>
      <div className="relative mx-auto mb-8 h-36 w-36">
        <div className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-white/20 bf-orbit-spin" />
        <div
          className="pointer-events-none absolute inset-3 rounded-full border-2"
          style={{ borderColor: `${settings.accent_color}50` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
        </div>
      </div>
      <div className="bf-profile-name-row">
        <Username name={displayName} settings={settings} profile={profile} />
        <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
      </div>
      <ProfileHandle profile={profile} className="mt-1" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="justify-center" />
      <div className="bf-profile-block mx-auto mt-2 max-w-md">
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function WaveLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const headerStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${settings.gradient_colors.join(", ")})` };

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="relative px-6 pb-12 pt-8" style={headerStyle}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative bf-profile-name-row">
          <Username name={displayName} settings={settings} profile={profile} className="text-3xl font-bold text-white" />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="relative mt-1 text-neutral-300" />
        <svg className="absolute -bottom-px left-0 w-full text-[#141414]" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0,40 C300,100 900,0 1200,50 L1200,80 L0,80 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="px-6 py-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function MosaicLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const palette = settings.gradient_colors.length >= 4
    ? settings.gradient_colors
    : [...settings.gradient_colors, settings.accent_color, "#1a1a1a", "#262626", "#333333"];
  const colors = Array.from({ length: 12 }, (_, i) => palette[i % palette.length]);

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="grid grid-cols-6 grid-rows-2 gap-0.5 p-0.5">
        {colors.map((color, i) => {
          if (i === 5) {
            return (
              <div key={i} className="relative aspect-square overflow-hidden rounded-sm bg-[#141414]">
                <div className="flex h-full w-full items-center justify-center p-1.5">
                  <ProfileAvatar
                    profile={profile}
                    displayName={displayName}
                    accentColor={settings.accent_color}
                    className="h-full w-full max-h-full max-w-full rounded-sm"
                  />
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="aspect-square rounded-sm" style={{ background: color }} />
          );
        })}
      </div>
      <div className="px-6 py-6">
        <div className="bf-profile-name-row">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-1" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function AuroraLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full overflow-hidden" style={buildCardStyle(settings)}>
      <div className="bf-layout-aurora relative px-6 py-10">
        <div className="bf-profile-avatar-row mb-4 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
        </div>
        <div className="bf-profile-name-row text-center">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-1 text-center" />
      </div>
      <div className="px-6 pb-8">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function HologramLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="bf-layout-hologram w-full overflow-hidden p-[2px]" style={{ borderRadius: settings.border_radius }}>
      <div className="bg-[#0a0a0a]/95 px-6 py-8" style={{ borderRadius: Math.max(settings.border_radius - 2, 0) }}>
        <div className="bf-profile-avatar-row mb-4 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-24 w-24" />
        </div>
        <div className="bf-profile-name-row text-center">
          <Username
            name={displayName}
            settings={settings}
            profile={profile}
            className="bg-gradient-to-r from-[#ff71ce] via-[#01cdfe] to-[#05ffa1] bg-clip-text text-3xl font-bold text-transparent"
          />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-1 text-center" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="justify-center" />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function SpotifyLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);
  const heroStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center top" }
    : { background: `linear-gradient(135deg, ${settings.accent_color}88 0%, #121212 100%)` };

  return (
    <div className="w-full overflow-hidden bg-[#121212]" style={buildCardStyle(settings)}>
      <div className="relative h-32 sm:h-36" style={heroStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-[#121212]" />
      </div>
      <div className="relative px-6 pb-8">
        <div className="-mt-14 mb-4 flex items-end gap-4">
          <ProfileAvatar
            profile={profile}
            displayName={displayName}
            accentColor={settings.accent_color}
            className="h-28 w-28 shrink-0 shadow-2xl ring-4 ring-[#121212] sm:h-32 sm:w-32"
          />
        </div>
        <div className="bf-profile-name-row">
          <Username name={displayName} settings={settings} profile={profile} className="text-3xl font-black tracking-tight text-white sm:text-4xl" />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-2 text-neutral-400" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileMainContent {...props} />
      </div>
    </div>
  );
}

function SpotlightLayout(props: LayoutProps) {
  const { profile, settings, badges, viewCount } = props;
  const displayName = getDisplayName(profile);
  const { displayBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="relative w-full overflow-hidden bg-black px-6 py-16" style={{ borderRadius: settings.border_radius }}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${settings.accent_color}, transparent 70%)` }}
      />
      <div className="relative text-center">
        <div className="bf-profile-avatar-row mb-6 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-28 w-28" />
        </div>
        <div className="bf-profile-name-row">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={displayBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mt-1" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="justify-center" />
        <div className="bf-profile-block mx-auto mt-4 max-w-md">
          <ProfileMainContent {...props} />
        </div>
      </div>
    </div>
  );
}

export const EXTENDED_LAYOUTS = {
  vaporwave: VaporwaveLayout,
  brutalist: BrutalistLayout,
  newspaper: NewspaperLayout,
  ticket: TicketLayout,
  vinyl: VinylLayout,
  discord: DiscordLayout,
  twitch: TwitchLayout,
  idcard: IdcardLayout,
  blueprint: BlueprintLayout,
  comic: ComicLayout,
  cyberpunk: CyberpunkLayout,
  luxury: LuxuryLayout,
  receipt: ReceiptLayout,
  zine: ZineLayout,
  orbit: OrbitLayout,
  wave: WaveLayout,
  mosaic: MosaicLayout,
  aurora: AuroraLayout,
  hologram: HologramLayout,
  spotify: SpotifyLayout,
  spotlight: SpotlightLayout,
} as const;
