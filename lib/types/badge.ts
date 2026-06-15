export type BadgeCategory =
  | "verification"
  | "creator"
  | "supporter"
  | "community"
  | "milestone"
  | "competition"
  | "seasonal"
  | "custom";

export type BadgeRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type BadgeAwardSource =
  | "manual"
  | "premium"
  | "analytics"
  | "event"
  | "discord"
  | "seasonal"
  | "staff";

export type Badge = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  icon_url?: string | null;
  color: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  sort_order: number;
  is_system: boolean;
  is_assignable: boolean;
  award_rule: string | null;
  created_at: string;
};

export type ProfileBadge = Badge & {
  profile_badge_id: string;
  assigned_at: string;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  award_source: BadgeAwardSource;
};

export type BadgeInventoryItem = Badge & {
  earned: boolean;
  profile_badge_id?: string;
  assigned_at?: string;
  is_visible?: boolean;
  is_featured?: boolean;
  user_sort_order?: number;
  award_source?: BadgeAwardSource;
};

export type BadgeFormState = {
  error?: string;
  success?: string;
};

export const BADGE_CATEGORIES: { id: BadgeCategory; label: string }[] = [
  { id: "verification", label: "Verification" },
  { id: "creator", label: "Creator" },
  { id: "supporter", label: "Supporter" },
  { id: "community", label: "Community" },
  { id: "milestone", label: "Milestone" },
  { id: "competition", label: "Competition" },
  { id: "seasonal", label: "Seasonal" },
  { id: "custom", label: "Custom" },
];

export const BADGE_RARITIES: BadgeRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export const RARITY_STYLES: Record<
  BadgeRarity,
  { ring: string; glow: string; label: string }
> = {
  common: { ring: "ring-white/10", glow: "", label: "Common" },
  rare: { ring: "ring-blue-500/30", glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]", label: "Rare" },
  epic: { ring: "ring-purple-500/40", glow: "shadow-[0_0_14px_rgba(168,85,247,0.3)]", label: "Epic" },
  legendary: { ring: "ring-amber-500/50", glow: "shadow-[0_0_16px_rgba(245,158,11,0.35)]", label: "Legendary" },
  mythic: { ring: "ring-[#00e5cc]/50", glow: "shadow-[0_0_18px_rgba(0,229,204,0.4)]", label: "Mythic" },
};
