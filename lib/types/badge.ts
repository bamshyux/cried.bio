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
  | "staff"
  | "store";

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
  common: { ring: "ring-slate-400/20", glow: "shadow-[0_0_10px_rgba(148,163,184,0.2)]", label: "Common" },
  rare: { ring: "ring-sky-400/35", glow: "shadow-[0_0_14px_rgba(56,189,248,0.3)]", label: "Rare" },
  epic: { ring: "ring-purple-400/40", glow: "shadow-[0_0_16px_rgba(192,132,252,0.35)]", label: "Epic" },
  legendary: { ring: "ring-amber-400/45", glow: "shadow-[0_0_18px_rgba(251,191,36,0.4)]", label: "Legendary" },
  mythic: { ring: "ring-white/40", glow: "shadow-[0_0_22px_rgba(255,255,255,0.35)]", label: "Mythic" },
};
