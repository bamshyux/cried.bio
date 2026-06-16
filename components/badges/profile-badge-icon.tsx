"use client";

import type { ReactNode } from "react";
import { BadgeGlyph } from "@/components/badges/badge-glyphs";
import { VerifiedBadgeIcon } from "@/components/badges/verified-badge-icon";
import { SelfGlow } from "@/components/ui/self-glow";
import { getBadgeSelfGlowStrength } from "@/lib/self-glow";

const VERIFIED_COLOR = "#3b82f6";

export function ProfileBadgeIcon({
  slug,
  color,
  size = 22,
  iconUrl,
  monochrome = false,
  glowEnabled = true,
  hovered = false,
  featured = false,
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
  className?: string;
}) {
  const hasCustomImage = Boolean(iconUrl?.trim());
  const isVerified = slug === "verified" && !hasCustomImage;
  const isOg = slug === "og" && !hasCustomImage;
  const fillColor = monochrome ? "#e4e4e7" : color;
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
        <BadgeGlyph slug={slug} color={fillColor} />
      </svg>
    );
  }

  const glowColor = isVerified ? VERIFIED_COLOR : fillColor;

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
