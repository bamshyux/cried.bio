"use client";

import { useState, type CSSProperties } from "react";
import {
  buildCardStyle,
  getUsernameEffectClass,
  stripUsernameTextColorClasses,
  usernameEffectUsesClipText,
} from "@/lib/settings";
import { getProfileUidTier } from "@/lib/profile";
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
  const [imageFailed, setImageFailed] = useState(false);

  if (profile.avatar_url && !imageFailed) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName}
        className={`${className} ${rounded} object-cover`}
        style={{ boxShadow: ring }}
        onError={() => setImageFailed(true)}
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

function ProfileUidBadge({ uid, accentColor }: { uid: number; accentColor: string }) {
  const tier = getProfileUidTier(uid);

  return (
    <span
      className={`bf-profile-uid bf-profile-uid--${tier}`}
      style={{ ["--uid-accent" as string]: accentColor }}
      title={`Account ${uid.toLocaleString("en-US")}`}
    >
      <span className="bf-profile-uid__chip">
        <span className="bf-profile-uid__label">UID</span>
        <span className="bf-profile-uid__sep" aria-hidden />
        <span className="bf-profile-uid__value">
          <span className="bf-profile-uid__hash">#</span>
          {uid.toLocaleString("en-US")}
        </span>
      </span>
    </span>
  );
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
  const effect = settings.username_effect;
  const effectClass = getUsernameEffectClass(effect);
  const usesClipText = usernameEffectUsesClipText(effect);
  const baseClass = className ?? "text-2xl font-semibold tracking-tight sm:text-3xl";

  const glowStyle: CSSProperties = (() => {
    if (effect === "none") {
      return { textShadow: "none", filter: "none" };
    }
    if (effect === "shadow") {
      return {
        textShadow:
          "-1px -1px 0 rgba(255,255,255,0.45), 1px 1px 0 rgba(0,0,0,0.95), 2px 2px 0 rgba(0,0,0,0.88), 3px 3px 0 rgba(0,0,0,0.8), 4px 4px 0 rgba(0,0,0,0.72), 5px 5px 0 rgba(0,0,0,0.64), 6px 6px 0 rgba(0,0,0,0.55), 8px 8px 0 rgba(0,0,0,0.42), 10px 12px 24px rgba(0,0,0,0.85)",
      };
    }
    if (effect === "glow") {
      return {
        textShadow: `0 0 24px ${settings.accent_color}, 0 0 48px ${settings.accent_color}90`,
      };
    }
    if (effect === "neon") {
      return { textShadow: `0 0 24px ${settings.accent_color}` };
    }
    if (usesClipText) return {};
    if (settings.neon_glow) {
      return { textShadow: `0 0 20px ${settings.accent_color}80` };
    }
    return {};
  })();

  const sanitizedStyle: CSSProperties | undefined =
    effect === "none"
      ? style
        ? { ...style, textShadow: undefined, filter: undefined }
        : undefined
      : style;

  const headingClass = usesClipText
    ? stripUsernameTextColorClasses(baseClass)
    : `${baseClass} ${effectClass}`.trim();

  const headingStyle =
    glowStyle.textShadow || sanitizedStyle
      ? { ...glowStyle, ...sanitizedStyle }
      : undefined;

  const showUid = profile.uid != null;

  return (
    <div
      className={`bf-profile-username-wrap relative inline-flex max-w-full flex-col items-start ${showUid ? "group cursor-help" : ""}`}
      tabIndex={showUid ? 0 : undefined}
    >
      {showUid ? (
        <div className="bf-profile-uid-hover pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2">
          <ProfileUidBadge uid={profile.uid!} accentColor={settings.accent_color} />
        </div>
      ) : null}
      <h1 className={headingClass} style={headingStyle}>
        {usesClipText ? (
          <span className={`inline-block ${effectClass}`}>
            {name}
            {suffix}
          </span>
        ) : (
          <>
            {name}
            {suffix}
          </>
        )}
      </h1>
    </div>
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
