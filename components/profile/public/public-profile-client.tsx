"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  buildCardStyle,
  getFontCss,
  getGoogleFontsUrl,
  getUsernameEffectClass,
} from "@/lib/settings";
import { formatProfileUid } from "@/lib/profile";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileLink } from "@/lib/types/link";
import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import { BioForgeLogo } from "@/components/brand/logo";
import { AnalyticsTracker } from "./analytics-tracker";
import { BadgeRow } from "@/components/badges/badge-ui";
import { preparePublicBadges, prepareUsernameBadges, buildBadgeStyleOptions } from "@/lib/badges/display";
import { MusicPlayer } from "./music-player";
import { ParticleCanvas } from "./particle-canvas";
import { ProfileBackground } from "./profile-background";
import { CursorEffectCanvas, TypingBio } from "./profile-effects";
import type { ActivityEvent } from "@/lib/types/activity";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { GuestbookEntry } from "@/lib/types/guestbook";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { SocialProfile } from "@/lib/types/social";
import { ProfileContentSections } from "./profile-content-sections";
import { ProfileParallaxCard } from "./profile-parallax";

function ProfileHandle({ profile, className = "" }: { profile: Profile; className?: string }) {
  return (
    <p className={`text-sm text-neutral-500 ${className}`.trim()}>
      @{profile.username}
    </p>
  );
}

function ProfileMeta({
  profile,
  settings,
  viewCount,
  className = "",
}: {
  profile: Profile;
  settings: ProfileSettings;
  viewCount: number;
  className?: string;
}) {
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return (
    <div className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 ${className}`.trim()}>
      {settings.show_view_count && <span>{viewCount.toLocaleString()} views</span>}
      {settings.show_join_date && <span>Joined {joinDate}</span>}
    </div>
  );
}

function ProfileAvatar({
  profile,
  displayName,
  accentColor,
  className = "h-24 w-24",
}: {
  profile: Profile;
  displayName: string;
  accentColor: string;
  className?: string;
}) {
  const ring = `0 0 0 2px ${accentColor}40, 0 8px 24px rgba(0,0,0,0.5)`;

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName}
        className={`${className} rounded-full object-cover`}
        style={{ boxShadow: ring }}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full text-2xl font-bold text-[#090909]`}
      style={{ background: accentColor, boxShadow: ring }}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function computeHoverTooltipPlacement(rect: DOMRect, estimatedHeight = 36) {
  const gap = 8;
  const padding = 12;
  const centerX = rect.left + rect.width / 2;
  const above = rect.top - estimatedHeight - gap > padding;

  return {
    left: Math.min(Math.max(centerX, padding + 60), window.innerWidth - padding - 60),
    top: above ? rect.top - gap : rect.bottom + gap,
    above,
  };
}

function Username({ name, settings, profile }: { name: string; settings: ProfileSettings; profile: Profile }) {
  const effectClass = getUsernameEffectClass(settings.username_effect);
  const glowStyle =
    settings.username_effect === "glow"
      ? { textShadow: `0 0 24px ${settings.accent_color}` }
      : settings.neon_glow
        ? { textShadow: `0 0 20px ${settings.accent_color}80` }
        : {};
  const anchorRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState<ReturnType<typeof computeHoverTooltipPlacement> | null>(null);
  const showUid = profile.uid != null;

  const updatePlacement = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPlacement(computeHoverTooltipPlacement(rect));
  }, []);

  const handleEnter = () => {
    updatePlacement();
    setHovered(true);
  };

  const handleLeave = () => {
    setHovered(false);
    setPlacement(null);
  };

  return (
    <>
      <div
        ref={anchorRef}
        tabIndex={showUid ? 0 : undefined}
        onMouseEnter={showUid ? handleEnter : undefined}
        onMouseLeave={showUid ? handleLeave : undefined}
        onFocus={showUid ? handleEnter : undefined}
        onBlur={showUid ? handleLeave : undefined}
        className={`relative inline-block ${hovered ? "z-[9999]" : ""}`}
      >
        <h1
          className={`text-2xl font-semibold tracking-tight sm:text-3xl ${effectClass}`}
          style={glowStyle}
        >
          {name}
        </h1>
      </div>
      {showUid && hovered && placement &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10000] w-max rounded-lg border border-white/10 bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-300 shadow-xl"
            style={{
              left: placement.left,
              top: placement.top,
              transform: placement.above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
          >
            {formatProfileUid(profile.uid!)}
          </div>,
          document.body,
        )}
    </>
  );
}

type LayoutProps = {
  profile: Profile;
  links: ProfileLink[];
  settings: ProfileSettings;
  badges: ProfileBadge[];
  viewCount: number;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  guestbook: GuestbookEntry[];
  activity: ActivityEvent[];
  friends: SocialProfile[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
};

function ProfileMainContent(props: Omit<LayoutProps, "badges" | "viewCount"> & { hideBio?: boolean }) {
  return <ProfileContentSections {...props} />;
}

function getLayoutBadges(badges: ProfileBadge[], settings: ProfileSettings) {
  return {
    publicBadges: preparePublicBadges(badges, settings),
    usernameBadges: prepareUsernameBadges(badges, settings),
    styleOptions: buildBadgeStyleOptions(settings),
  };
}

function ProfileBadgeSection({
  badges,
  styleOptions,
  className = "",
}: {
  badges: ProfileBadge[];
  styleOptions?: import("@/lib/badges/display").BadgeStyleOptions;
  className?: string;
}) {
  if (badges.length === 0) return null;
  return (
    <div className={`relative z-10 mb-4 overflow-visible ${className}`.trim()}>
      <BadgeRow badges={badges} styleOptions={styleOptions} />
    </div>
  );
}

function bannerTopRadius(borderRadius: number) {
  return {
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
  };
}

function ClassicLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full" style={buildCardStyle(settings)}>
      {profile.banner_url ? (
        <div className="h-36 overflow-hidden sm:h-44" style={bannerTopRadius(settings.border_radius)}>
          <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-24 overflow-hidden sm:h-32" style={{ ...bannerTopRadius(settings.border_radius), background: `linear-gradient(135deg, ${settings.gradient_colors.join(", ")})` }} />
      )}
      <div className="px-6 pb-6 pt-4">
        <div className="-mt-10 mb-4 flex items-end gap-4">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} />
          <div className="pb-1">
            <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
              <Username name={displayName} settings={settings} profile={profile} />
              <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} className="mb-3" />
          </div>
        </div>
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />

        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function ModernLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full px-6 py-10 text-center" style={buildCardStyle(settings)}>
      <div className="mx-auto mb-4 flex justify-center">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-28 w-28" />
      </div>
      <div className="relative z-10 mb-1 flex flex-wrap items-center justify-center gap-2 overflow-visible">
        <Username name={displayName} settings={settings} profile={profile} />
        <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
      </div>
      <ProfileHandle profile={profile} className="mb-4" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
      <div className="mx-auto mb-4 flex justify-center">
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
      </div>
      <div className="mx-auto max-w-md">
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function GamingLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full" style={{ ...buildCardStyle(settings), borderRadius: Math.min(settings.border_radius, 6) }}>
      <div className="border-b px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: `${settings.accent_color}30`, color: settings.accent_color }}>
        Player Profile
      </div>
      <div className="flex gap-4 p-5">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20 shrink-0" />
        <div>
          <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
            <Username name={displayName} settings={settings} profile={profile} />
            <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} className="mb-3" />
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
          <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        </div>
      </div>
      <div className="space-y-2 px-5 pb-5">
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function PortfolioLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="grid w-full md:grid-cols-[180px_1fr]" style={buildCardStyle(settings)}>
      <div className="flex flex-col items-center border-b border-white/[0.06] p-6 md:border-b-0 md:border-r">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-28 w-28" />
      </div>
      <div className="p-6">
        <div className="relative z-10 mb-1 flex flex-wrap items-center gap-2 overflow-visible">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mb-3" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />

        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function MinimalLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full py-6">
      <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2 overflow-visible">
        <Username name={displayName} settings={settings} profile={profile} />
        <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
      </div>
      <ProfileHandle profile={profile} className="mb-3" />
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
      <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />

        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
    </div>
  );
}

function StackedLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full overflow-visible text-center" style={buildCardStyle(settings)}>
      {profile.banner_url ? (
        <div className="h-32 overflow-hidden sm:h-40" style={bannerTopRadius(settings.border_radius)}>
          <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-28 overflow-hidden sm:h-36" style={{ ...bannerTopRadius(settings.border_radius), background: `linear-gradient(135deg, ${settings.gradient_colors.join(", ")})` }} />
      )}
      <div className="px-6 pb-8 pt-0">
        <div className="-mt-12 mb-4 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-24 w-24" />
        </div>
        <div className="relative z-10 mb-1 flex flex-wrap items-center justify-center gap-2 overflow-visible">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mb-4" />
        <div className="flex justify-center">
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        </div>
        <div className="mt-2 flex justify-center">
          <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        </div>

        <div className="mx-auto max-w-md">
          <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

function SplitLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div
      className="split-layout grid w-full md:grid-cols-2"
      style={
        {
          ...buildCardStyle(settings),
          "--bf-card-radius": `${settings.border_radius}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="split-layout__banner relative flex min-h-[220px] items-center justify-center border-b border-white/[0.06] md:min-h-[320px] md:border-b-0 md:border-r"
        style={
          profile.banner_url
            ? undefined
            : { background: `linear-gradient(160deg, ${settings.gradient_colors.join(", ")})` }
        }
      >
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="relative z-10 p-6">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-28 w-28" />
        </div>
      </div>
      <div className="split-layout__content flex flex-col justify-center p-6">
        <div className="relative z-10 mb-1 flex flex-wrap items-center gap-2 overflow-visible">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mb-3" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function TerminalSection({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-white/[0.06] pt-4 ${className}`.trim()}>
      {label && (
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600">
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

function TerminalLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);
  const title = profile.username ? `@${profile.username}` : "profile";

  return (
    <div
      className="w-full overflow-visible font-mono text-sm"
      style={{ ...buildCardStyle(settings), borderRadius: Math.min(settings.border_radius, 8) }}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#0a0a0a] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2 truncate text-[10px] text-neutral-500">{title}</span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-4">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
              <h1 className="text-lg font-semibold tracking-tight text-white">{displayName}</h1>
              <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} className="mt-1" />
            <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} className="mb-0 mt-2" />
          </div>
        </div>

        {publicBadges.length > 0 && (
          <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} className="mb-0" />
        )}

        {profile.bio && (
          <TerminalSection label="About">
            <p className="leading-relaxed text-neutral-300">
              <TypingBio text={profile.bio} enabled={settings.typing_bio} />
            </p>
          </TerminalSection>
        )}

        <TerminalSection className={profile.bio ? undefined : "!border-t-0 !pt-0"}>
          <ProfileMainContent
            profile={profile}
            links={links}
            settings={settings}
            embeds={embeds}
            featured={featured}
            guestbook={guestbook}
            activity={activity}
            friends={friends}
            followerCount={followerCount}
            followingCount={followingCount}
            isFollowing={isFollowing}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            hideBio
          />
        </TerminalSection>
      </div>
    </div>
  );
}

function CompactLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full p-5" style={buildCardStyle(settings)}>
      <div className="mb-4 flex items-center gap-3">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
            <h1 className="truncate text-lg font-semibold">{displayName}</h1>
            <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
          </div>
          <ProfileHandle profile={profile} />
        </div>
      </div>
      <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
      <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
      <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
    </div>
  );
}

function CardLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div
      className="mx-auto w-full max-w-sm overflow-visible shadow-2xl"
      style={{ ...buildCardStyle(settings), borderRadius: Math.max(settings.border_radius, 20) }}
    >
      <div className="px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20" />
        </div>
        <div className="relative z-10 mb-1 flex flex-wrap items-center justify-center gap-2 overflow-visible">
          <Username name={displayName} settings={settings} profile={profile} />
          <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
        </div>
        <ProfileHandle profile={profile} className="mb-3" />
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function NeonLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div
      className="w-full overflow-hidden p-[1px]"
      style={{
        borderRadius: settings.border_radius,
        background: `linear-gradient(135deg, ${settings.accent_color}, ${settings.accent_color}40, ${settings.accent_color})`,
        boxShadow: `0 0 40px ${settings.accent_color}30, 0 0 80px ${settings.accent_color}15`,
      }}
    >
      <div className="overflow-visible bg-[#0a0a0a]/95 p-6" style={{ borderRadius: Math.max(settings.border_radius - 1, 0) }}>
        <div className="mb-4 flex items-start gap-4">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-20 w-20 shrink-0" />
          <div>
            <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
              <Username name={displayName} settings={settings} profile={profile} />
              <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} className="mt-1" />
          </div>
        </div>
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function MagazineLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="relative w-full overflow-visible p-6 sm:p-8" style={buildCardStyle(settings)}>
      <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
        <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16 sm:h-20 sm:w-20" />
      </div>
      <div className="max-w-[75%] pr-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600">Profile</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1
            className={`text-4xl font-bold leading-none tracking-tight sm:text-5xl ${getUsernameEffectClass(settings.username_effect)}`}
            style={settings.neon_glow ? { textShadow: `0 0 30px ${settings.accent_color}60` } : undefined}
          >
            {displayName}
          </h1>
        </div>
        <ProfileHandle profile={profile} className="mt-3" />
        <div className="relative z-10 mt-2 overflow-visible">
          <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
        </div>
      </div>
      <div className="mt-6 border-t border-white/[0.06] pt-6">
        <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        <ProfileBadgeSection badges={publicBadges} styleOptions={styleOptions} />
        <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function BentoLayout({ profile, links, settings, badges, viewCount, embeds, featured, guestbook, activity, friends, followerCount, followingCount, isFollowing, isLoggedIn, currentUserId }: LayoutProps) {
  const displayName = profile.display_name || profile.username || "User";
  const { publicBadges, usernameBadges, styleOptions } = getLayoutBadges(badges, settings);

  return (
    <div className="w-full p-4 sm:p-5" style={buildCardStyle(settings)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 sm:col-span-2">
          <ProfileAvatar profile={profile} displayName={displayName} accentColor={settings.accent_color} className="h-16 w-16 shrink-0" />
          <div className="min-w-0">
            <div className="relative z-10 flex flex-wrap items-center gap-2 overflow-visible">
              <Username name={displayName} settings={settings} profile={profile} />
              <BadgeRow badges={usernameBadges} compact styleOptions={styleOptions} />
            </div>
            <ProfileHandle profile={profile} className="mt-1" />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Stats</p>
          <ProfileMeta profile={profile} settings={settings} viewCount={viewCount} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 overflow-visible">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Badges</p>
          {publicBadges.length > 0 ? (
            <BadgeRow badges={publicBadges} styleOptions={styleOptions} />
          ) : (
            <p className="text-xs text-neutral-600">No badges yet</p>
          )}
        </div>
        {profile.bio && (
          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 sm:col-span-2">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">About</p>
            <div className="text-sm text-neutral-300">
              <TypingBio text={profile.bio} enabled={settings.typing_bio} />
            </div>
          </div>
        )}
        <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 sm:col-span-2">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Links</p>
          <ProfileMainContent profile={profile} links={links} settings={settings} embeds={embeds} featured={featured} guestbook={guestbook} activity={activity} friends={friends} followerCount={followerCount} followingCount={followingCount} isFollowing={isFollowing} isLoggedIn={isLoggedIn} currentUserId={currentUserId} hideBio />
        </div>
      </div>
    </div>
  );
}

const LAYOUTS = {
  classic: ClassicLayout,
  modern: ModernLayout,
  gaming: GamingLayout,
  portfolio: PortfolioLayout,
  minimal: MinimalLayout,
  stacked: StackedLayout,
  split: SplitLayout,
  terminal: TerminalLayout,
  compact: CompactLayout,
  card: CardLayout,
  neon: NeonLayout,
  magazine: MagazineLayout,
  bento: BentoLayout,
};

export function PublicProfileClient({
  profile,
  links,
  settings,
  badges,
  viewCount,
  embeds,
  featured,
  guestbook,
  activity,
  friends,
  followerCount,
  followingCount,
  isFollowing,
  isLoggedIn,
  currentUserId,
}: {
  profile: Profile;
  links: ProfileLink[];
  settings: ProfileSettings;
  badges: ProfileBadge[];
  viewCount: number;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  guestbook: GuestbookEntry[];
  activity: ActivityEvent[];
  friends: SocialProfile[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
}) {
  const fontCss = getFontCss(settings.font_family);
  const fontUrl = getGoogleFontsUrl(settings.font_family);
  const showParticles =
    (settings.background_type === "particles" || settings.particle_effect) &&
    settings.particle_effect;
  const Layout = LAYOUTS[settings.layout] ?? ClassicLayout;
  const layoutProps: LayoutProps = {
    profile,
    links,
    settings,
    badges,
    viewCount,
    embeds,
    featured,
    guestbook,
    activity,
    friends,
    followerCount,
    followingCount,
    isFollowing,
    isLoggedIn,
    currentUserId,
  };

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      <AnalyticsTracker profileId={profile.id} />
      <ProfileBackground settings={settings} />
      {showParticles && settings.particle_effect && (
        <ParticleCanvas effect={settings.particle_effect} />
      )}
      <CursorEffectCanvas effect={settings.cursor_effect} color={settings.accent_color} />
      <MusicPlayer settings={settings} />

      <div
        className="relative z-10 flex min-h-screen flex-col"
        style={{ color: settings.text_color, fontFamily: fontCss, "--bf-accent": settings.accent_color } as React.CSSProperties}
      >
        <header className="absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
          <Link href="/" className="group opacity-90 transition-opacity hover:opacity-100">
            <BioForgeLogo size={24} variant="muted" />
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/[0.07] bg-black/20 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:bg-black/30 hover:text-neutral-300"
          >
            Create yours
          </Link>
        </header>

        <main
          className={`flex flex-1 items-center justify-center px-5 py-20 ${
            settings.page_entrance ? "bf-page-entrance" : ""
          }`}
        >
          <div className="mx-auto w-full max-w-2xl">
            <ProfileParallaxCard enabled={settings.profile_parallax}>
              <Layout {...layoutProps} />
            </ProfileParallaxCard>
          </div>
        </main>
      </div>
    </>
  );
}
