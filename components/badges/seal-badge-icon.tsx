"use client";

import { useId } from "react";
import { SealBadgeGlyph } from "@/components/badges/seal-badge-glyphs";
import {
  SEAL_SHAPE,
  buildBadgeGlowFilter,
  darken,
  lighten,
} from "@/lib/badges/seal-utils";

export function SealBadgeIcon({
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
  const uid = useId().replace(/:/g, "");
  const gradId = `bf-seal-grad-${uid}`;
  const shineId = `bf-seal-shine-${uid}`;
  const clipId = `bf-seal-clip-${uid}`;

  const baseColor = monochrome ? "#71717a" : color;
  const topColor = monochrome ? "#d4d4d8" : lighten(baseColor, 38);
  const midColor = baseColor;
  const bottomColor = monochrome ? "#52525b" : darken(baseColor, 28);

  const filter = buildBadgeGlowFilter(baseColor, size, {
    enabled: glowEnabled,
    hovered,
    featured,
    monochrome,
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`bf-seal-badge block ${className}`.trim()}
      style={{ filter: filter === "none" ? undefined : filter }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="10%" y1="8%" x2="88%" y2="92%">
          <stop offset="0%" stopColor={topColor} />
          <stop offset="48%" stopColor={midColor} />
          <stop offset="100%" stopColor={bottomColor} />
        </linearGradient>
        <radialGradient id={shineId} cx="30%" cy="22%" r="62%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="24" cy="24" r="10.5" />
        </clipPath>
      </defs>

      <path d={SEAL_SHAPE} fill={`url(#${gradId})`} />
      <path d={SEAL_SHAPE} fill={`url(#${shineId})`} />

      {iconUrl && !monochrome ? (
        <image
          href={iconUrl}
          x="13.5"
          y="13.5"
          width="21"
          height="21"
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <g transform="translate(12, 12)">
          <SealBadgeGlyph slug={slug} />
        </g>
      )}
    </svg>
  );
}
