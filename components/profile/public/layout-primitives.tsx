"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { buildCardStyle, getUsernameEffectClass } from "@/lib/settings";
import { formatProfileUid } from "@/lib/profile";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileLink } from "@/lib/types/link";
import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import { BadgeRow } from "@/components/badges/badge-ui";
import { preparePublicBadges, buildBadgeStyleOptions } from "@/lib/badges/display";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ActivityEvent } from "@/lib/types/activity";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { GuestbookEntry } from "@/lib/types/guestbook";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { SocialProfile } from "@/lib/types/social";
import { ProfileContentSections } from "./profile-content-sections";

export type LayoutProps = {
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
  discordPresence?: DiscordPresence | null;
};

export function ProfileHandle({ profile, className = "" }: { profile: Profile; className?: string }) {
  return (
    <p className={`bf-profile-handle text-sm text-neutral-500 ${className}`.trim()}>
      @{profile.username}
    </p>
  );
}

function ProfileStatEyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M2.5 12s3.8-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.8 6.5-9.5 6.5S2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProfileStatLocationIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ProfileMeta({
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
  const showViews = settings.show_view_count;
  const location = profile.location?.trim() ?? "";
  const showLocation = location.length > 0;
  const showJoin = settings.show_join_date;
  const showStatsRow = showViews || showLocation;
  const formattedViewCount = Number.isFinite(viewCount)
    ? Math.max(0, Math.floor(viewCount)).toLocaleString()
    : "0";

  return (
    <div
      className={`mb-5 bf-profile-row flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-neutral-400 ${className}`.trim()}
    >
      {showStatsRow && (
        <div className="bf-profile-stats inline-flex flex-wrap items-center gap-2">
          {showViews && (
            <span className="inline-flex items-center gap-1.5">
              <ProfileStatEyeIcon className="shrink-0 opacity-80" />
              <span className="tabular-nums text-neutral-300">{formattedViewCount}</span>
            </span>
          )}
          {showViews && showLocation && (
            <span className="text-neutral-600" aria-hidden>
              |
            </span>
          )}
          {showLocation && (
            <span className="inline-flex items-center gap-1.5">
              <ProfileStatLocationIcon className="shrink-0 opacity-80" />
              <span className="text-neutral-300">{location}</span>
            </span>
          )}
        </div>
      )}
      {showJoin && <span>Joined {joinDate}</span>}
    </div>
  );
}

export function ProfileAvatar({
  profile,
  displayName,
  accentColor,
  className = "h-24 w-24",
  rounded = "rounded-full",
}: {
  profile: Profile;
  displayName: string;
  accentColor: string;
  className?: string;
  rounded?: string;
}) {
  const ring = `0 0 0 2px ${accentColor}40, 0 8px 24px rgba(0,0,0,0.5)`;

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName}
        className={`${className} ${rounded} object-cover`}
        style={{ boxShadow: ring }}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center ${rounded} text-2xl font-bold text-[#090909]`}
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

export function Username({
  name,
  settings,
  profile,
  className,
  style,
  suffix,
}: {
  name: string;
  settings: ProfileSettings;
  profile: Profile;
  className?: string;
  style?: CSSProperties;
  suffix?: string;
}) {
  const effectClass = getUsernameEffectClass(settings.username_effect);
  const glowStyle: CSSProperties =
    settings.username_effect === "glow"
      ? { textShadow: `0 0 24px ${settings.accent_color}` }
      : settings.neon_glow
        ? { textShadow: `0 0 20px ${settings.accent_color}80` }
        : {};
  const headingClass = className ?? `text-2xl font-semibold tracking-tight sm:text-3xl ${effectClass}`;
  const headingStyle = { ...glowStyle, ...style };
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
        className={`relative inline-block ${showUid ? "cursor-help" : ""} ${hovered ? "z-[9999]" : ""}`}
      >
        <h1 className={headingClass} style={Object.keys(headingStyle).length ? headingStyle : undefined}>
          {name}
          {suffix}
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

export function ProfileMainContent(props: Omit<LayoutProps, "badges" | "viewCount"> & { hideBio?: boolean }) {
  return <ProfileContentSections {...props} />;
}

export function getLayoutBadges(badges: ProfileBadge[], settings: ProfileSettings) {
  return {
    displayBadges: preparePublicBadges(badges, settings),
    styleOptions: buildBadgeStyleOptions(settings),
  };
}

export function bannerTopRadius(borderRadius: number) {
  return {
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
  };
}

export function getDisplayName(profile: Profile) {
  return profile.display_name || profile.username || "User";
}

export { buildCardStyle, getUsernameEffectClass };
