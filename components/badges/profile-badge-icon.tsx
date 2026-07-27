"use client";

import type { ReactNode } from "react";
import { BadgeGlyph } from "@/components/badges/badge-glyphs";
import { VerifiedBadgeIcon } from "@/components/badges/verified-badge-icon";
import { SelfGlow } from "@/components/ui/self-glow";
import { isSummer2026BadgeSlug, SUMMER_2026_BADGE_COLOR } from "@/lib/badges/seasonal-events";
import { getBadgeSelfGlowStrength } from "@/lib/self-glow";

const VERIFIED_COLOR = "#3b82f6";
const COLLECTION_SILHOUETTE_COLOR = "#71717a";

export function ProfileBadgeIcon({
  slug,
  color,
  size = 22,
  iconUrl,
  monochrome = false,
  glowEnabled = true,
  hovered = false,
  featured = false,
  silhouette = false,
  className = "",
}: {
  slug: string;
  color: string;
  size?: number;
  iconUrl?: string | null;
  monochrome?: boolean;
  glowEnabled?: boolean;
  hovered?: boolean;
  featured?: boolean;
  silhouette?: boolean;
  className?: string;
}) {
  const hasCustomImage = Boolean(iconUrl?.trim());
  const isVerified = slug === "verified" && !hasCustomImage;
  const isOg = slug === "og" && !hasCustomImage;
  const isSummer =
    isSummer2026BadgeSlug(slug) && !hasCustomImage && !silhouette && !monochrome;
  const fillColor = silhouette
    ? COLLECTION_SILHOUETTE_COLOR
    : monochrome
      ? color
      : isSummer
        ? SUMMER_2026_BADGE_COLOR
        : color;
  const glowStrength = isOg ? 0.22 : getBadgeSelfGlowStrength({ hovered, featured });

  let icon: ReactNode;

  if (hasCustomImage) {
    icon = (
      <img
        src={iconUrl!}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={`bf-profile-badge-icon bf-profile-badge-icon--photo block object-contain ${className}`.trim()}
        aria-hidden
      />
    );
  } else if (isVerified) {
    icon = <VerifiedBadgeIcon size={size} monochrome={monochrome} className={className} />;
  } else {
    icon = (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`bf-profile-badge-icon block ${className}`.trim()}
        aria-hidden
      >
        <BadgeGlyph slug={slug} color={fillColor} monochrome={monochrome} />
      </svg>
    );
  }

  const glowColor = isVerified && !monochrome ? VERIFIED_COLOR : fillColor;

  if (silhouette) {
    return (
      <span
        className={`bf-profile-badge-icon-wrap--silhouette inline-flex items-center justify-center ${className}`.trim()}
        style={{ width: size, height: size, lineHeight: 0, color: COLLECTION_SILHOUETTE_COLOR }}
      >
        {icon}
      </span>
    );
  }

  if (isSummer) {
    return (
      <span
        className={`bf-profile-badge-icon-wrap--summer inline-flex items-center justify-center ${className}`.trim()}
        style={{ width: size, height: size, lineHeight: 0 }}
      >
        {icon}
      </span>
    );
  }

  return (
    <SelfGlow
      enabled={glowEnabled && !hasCustomImage}
      color={glowColor}
      size={size}
      strength={glowStrength}
      rounded={hasCustomImage ? "none" : "full"}
      className={[hasCustomImage ? "bf-self-glow--natural" : "", className].filter(Boolean).join(" ")}
    >
      {icon}
    </SelfGlow>
  );
}
