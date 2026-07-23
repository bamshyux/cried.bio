import type { BadgeCategory, BadgeRarity } from "@/lib/types/badge";

type BadgeGlowInput = {
  slug: string;
  category?: BadgeCategory;
  rarity?: BadgeRarity;
  color: string;
};

export type BadgeGlowTone = "verified" | "premium" | "gold" | "accent";

const GLOW_RGB: Record<Exclude<BadgeGlowTone, "accent">, string> = {
  verified: "59, 130, 246",
  premium: "168, 85, 247",
  gold: "234, 179, 8",
};

const GOLD_SLUGS = new Set([
  "founder",
  "champion",
  "tournament-winner",
  "og",
  "partner",
  "year-one",
]);

const PREMIUM_SLUGS = new Set(["premium", "staff", "moderator", "creator", "community-choice"]);

export function resolveBadgeGlowTone(badge: BadgeGlowInput): BadgeGlowTone {
  if (badge.slug === "verified") return "verified";
  if (badge.slug === "gifter") return "accent";
  if (PREMIUM_SLUGS.has(badge.slug)) return "premium";
  if (GOLD_SLUGS.has(badge.slug)) return "gold";
  if (badge.category === "verification" && badge.slug === "developer") return "accent";
  if (badge.rarity === "legendary" || badge.rarity === "mythic") return "gold";
  if (badge.rarity === "epic") return "premium";
  if (badge.rarity === "rare") return "verified";
  return "accent";
}

function accentRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "255, 255, 255";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return "255, 255, 255";
  return `${r}, ${g}, ${b}`;
}

export function buildBadgeGlowFilter(
  badge: BadgeGlowInput,
  options?: { hovered?: boolean; featured?: boolean; monochrome?: boolean },
): string {
  const hovered = options?.hovered ?? false;
  const featured = options?.featured ?? false;
  const monochrome = options?.monochrome ?? false;

  const base = featured ? 0.55 : 0.38;
  const strength = hovered ? base + 0.28 : base;

  if (monochrome) {
    if (!hovered && !featured) return "none";
    const whiteStrength = hovered ? 0.42 : 0.28;
    return [
      `drop-shadow(0 0 2px rgba(255,255,255,${whiteStrength}))`,
      `drop-shadow(0 0 5px rgba(255,255,255,${whiteStrength * 0.55}))`,
    ].join(" ");
  }

  const tone = resolveBadgeGlowTone(badge);
  const rgb = tone === "accent" ? accentRgb(badge.color) : GLOW_RGB[tone];

  return [
    `drop-shadow(0 0 2px rgba(${rgb}, ${strength * 0.85}))`,
    `drop-shadow(0 0 6px rgba(${rgb}, ${strength * 0.45}))`,
  ].join(" ");
}

export const COMPACT_BADGE_ICON_SIZE = 22;
