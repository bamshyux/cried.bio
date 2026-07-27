"use client";

import { ProfileBadgeIcon } from "@/components/badges/profile-badge-icon";
import type { BadgeRarity } from "@/lib/types/badge";

export type MedallionBadge = {
  slug: string;
  color: string;
  rarity: BadgeRarity;
  icon_url?: string | null;
  is_featured?: boolean;
};

export function BadgeMedallion({
  badge,
  size = 22,
  hovered = false,
  monochrome = false,
  featured = false,
  glowEnabled = true,
}: {
  badge: MedallionBadge;
  size?: number;
  hovered?: boolean;
  monochrome?: boolean;
  featured?: boolean;
  glowEnabled?: boolean;
}) {
  const isFeatured = featured || badge.is_featured;
  const active = hovered || isFeatured;
  const scale = active ? 1.1 : 1;

  return (
    <span
      className={[
        "bf-badge-medallion",
        monochrome ? "bf-badge-medallion--mono" : "",
        isFeatured ? "bf-badge-medallion--featured" : "",
        active ? "bf-badge-medallion--active" : "",
        glowEnabled ? "" : "bf-badge-medallion--no-glow",
        badge.slug === "og" || badge.slug === "year-one" ? "bf-badge-medallion--milestone" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-badge-slug={badge.slug}
      style={{
        width: size,
        height: size,
        transform: `scale(${scale})`,
      }}
    >
      <ProfileBadgeIcon
        slug={badge.slug}
        color={badge.color}
        size={size}
        iconUrl={badge.icon_url}
        monochrome={monochrome}
        glowEnabled={glowEnabled}
        hovered={hovered}
        featured={isFeatured}
      />
    </span>
  );
}
