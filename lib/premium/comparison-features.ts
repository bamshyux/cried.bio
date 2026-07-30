import { PLAN_DEFINITIONS } from "@/lib/premium/plans";

export type PremiumFeaturePreview =
  | "music"
  | "pages"
  | "badge"
  | "fonts"
  | "effects"
  | "widgets"
  | "schedules"
  | "customize"
  | "early-access"
  | "analytics";

export type FeatureAvailability =
  | { kind: "included" }
  | { kind: "excluded" }
  | { kind: "partial"; label: string }
  | { kind: "limit"; label: string };

export type PremiumComparisonFeature = {
  id: string;
  name: string;
  description: string;
  free: FeatureAvailability;
  premium: FeatureAvailability;
  preview: PremiumFeaturePreview;
};

const free = PLAN_DEFINITIONS.free.entitlements;
const lite = PLAN_DEFINITIONS.premium_lite.entitlements;

export const PREMIUM_COMPARISON_FEATURES: PremiumComparisonFeature[] = [
  {
    id: "music",
    name: "Multiple music tracks",
    description:
      "Add multiple songs to your profile, build playlists, shuffle tracks, and control autoplay — perfect for creators who want their page to sound as good as it looks.",
    free: { kind: "limit", label: "1 track" },
    premium: { kind: "limit", label: `Up to ${lite.max_music_tracks} + playlists` },
    preview: "music",
  },
  {
    id: "pages",
    name: "Multiple profile pages",
    description:
      "Create extra pages for galleries, portfolios, FAQs, embeds, widgets, and more — all under one cried.bio link with shared navigation.",
    free: { kind: "excluded" },
    premium: { kind: "limit", label: `${lite.max_profile_pages} extra pages` },
    preview: "pages",
  },
  {
    id: "badge",
    name: "Premium badge",
    description:
      "Receive an exclusive Premium badge displayed on your public profile so visitors know you're a supporter.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "badge",
  },
  {
    id: "fonts",
    name: "Premium fonts",
    description:
      "Access exclusive font families unavailable on the free plan for bios, links, and profile typography.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "fonts",
  },
  {
    id: "profile-effects",
    name: "Profile picture effects",
    description:
      "Wrap your avatar in animated borders — neon glow, fire, holographic, matrix, aurora, and 30+ more premium ring styles.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "effects",
  },
  {
    id: "effects",
    name: "Premium effects",
    description:
      "Unlock animated card effects, premium cursor styles, border animations, profile picture effects, and one custom effect request built for your profile.",
    free: { kind: "partial", label: "Basic effects" },
    premium: { kind: "included" },
    preview: "effects",
  },
  {
    id: "widgets",
    name: "Widgets & embeds",
    description:
      "Add Discord presence, Spotify, GitHub, Roblox, countdowns, clocks, and more — with higher featured block limits on Premium.",
    free: { kind: "limit", label: `${free.max_featured_blocks} featured blocks` },
    premium: { kind: "limit", label: `${lite.max_featured_blocks} featured blocks` },
    preview: "widgets",
  },
  {
    id: "schedules",
    name: "Scheduled presets",
    description:
      "Automatically switch your profile preset based on time or date — seasonal themes, event promos, or day/night layouts on autopilot.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "schedules",
  },
  {
    id: "customize",
    name: "Advanced customization",
    description:
      "More layout controls, premium fonts, animated effects, custom domains, and deeper profile settings across your dashboard.",
    free: { kind: "partial", label: "Core customization" },
    premium: { kind: "included" },
    preview: "customize",
  },
  {
    id: "analytics",
    name: "Advanced analytics",
    description:
      "Go beyond basic view counts with deeper traffic insights, trends, and profile performance data in your dashboard.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "analytics",
  },
  {
    id: "early-access",
    name: "Early access",
    description:
      "Receive new Premium features before everyone else — layouts, effects, and tools land on your profile first.",
    free: { kind: "excluded" },
    premium: { kind: "included" },
    preview: "early-access",
  },
];
