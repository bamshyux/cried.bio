import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";
import type { CSSProperties } from "react";

export type LayoutColorSlotKey = "primary" | "secondary" | "tertiary";

export type LayoutColorConfig = {
  primary: string;
  secondary?: string;
  tertiary?: string;
  /** When true, empty override falls back to profile accent_color. */
  inheritPrimary?: boolean;
  /** When true, empty override falls back to gradient_colors[1] or accent. */
  inheritSecondary?: boolean;
  labels?: Partial<Record<LayoutColorSlotKey, string>>;
};

export type ResolvedLayoutColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

/** Layouts with theme-specific colors that can be customized in Customize. */
export const LAYOUT_COLOR_CONFIG: Partial<Record<ProfileLayout, LayoutColorConfig>> = {
  glass: {
    primary: "#a855f7",
    secondary: "#e9d5ff",
    inheritPrimary: true,
    inheritSecondary: true,
    labels: { primary: "Glow color", secondary: "Secondary glow" },
  },
  crystal: {
    primary: "#93c5fd",
    secondary: "#ffffff",
    inheritPrimary: true,
    inheritSecondary: true,
    labels: { primary: "Crystal glow", secondary: "Highlight" },
  },
  monarch: {
    primary: "#c9a84c",
    secondary: "#e8d5a3",
    tertiary: "#8b6914",
    labels: { primary: "Gold", secondary: "Light gold", tertiary: "Deep gold" },
  },
  glitch: {
    primary: "#ff0080",
    secondary: "#00dfd8",
    labels: { primary: "Magenta", secondary: "Cyan" },
  },
  noir: {
    primary: "#fafafa",
    labels: { primary: "Accent" },
  },
  arcade: {
    primary: "#6366f1",
    secondary: "#c7d2fe",
    labels: { primary: "Cabinet glow", secondary: "Header text" },
  },
  passport: {
    primary: "#1e3a5f",
    secondary: "#60a5fa",
    labels: { primary: "Document blue", secondary: "Stamp accent" },
  },
  cassette: {
    primary: "#f97316",
    labels: { primary: "Tape accent" },
  },
  nebuladrift: {
    primary: "#a855f7",
    secondary: "#6366f1",
    inheritPrimary: true,
    labels: { primary: "Nebula pink", secondary: "Nebula blue" },
  },
  samurai: {
    primary: "#dc2626",
    secondary: "#7f1d1d",
    tertiary: "#450a0a",
    labels: { primary: "Blade red", secondary: "Mid tone", tertiary: "Shadow" },
  },
  graffiti: {
    primary: "#f472b6",
    secondary: "#22d3ee",
    tertiary: "#fde047",
    inheritPrimary: true,
    labels: { primary: "Spray pink", secondary: "Spray cyan", tertiary: "Spray yellow" },
  },
  prismstack: {
    primary: "#6366f1",
    secondary: "#22c55e",
    tertiary: "#f97316",
    inheritPrimary: true,
    inheritSecondary: true,
    labels: { primary: "Bar 1", secondary: "Bar 2", tertiary: "Bar 3" },
  },
  command: {
    primary: "#22c55e",
    labels: { primary: "Terminal green" },
  },
  bloom: {
    primary: "#f472b6",
    inheritPrimary: true,
    labels: { primary: "Floral accent" },
  },
  stealth: {
    primary: "#4ade80",
    secondary: "#14532d",
    labels: { primary: "Night vision", secondary: "Border" },
  },
  emberforge: {
    primary: "#ea580c",
    secondary: "#fb923c",
    labels: { primary: "Ember", secondary: "Spark" },
  },
  matrix: {
    primary: "#22c55e",
    labels: { primary: "Matrix green" },
  },
  tapewave: {
    primary: "#38bdf8",
    labels: { primary: "Wave blue" },
  },
  phoenix: {
    primary: "#f97316",
    secondary: "#ea580c",
    tertiary: "#fb923c",
    labels: { primary: "Flame", secondary: "Core", tertiary: "Wing" },
  },
  vaporwave: {
    primary: "#ff71ce",
    secondary: "#01cdfe",
    tertiary: "#05ffa1",
    labels: { primary: "Pink", secondary: "Cyan", tertiary: "Mint" },
  },
  twitch: {
    primary: "#9146ff",
    secondary: "#bf94ff",
    labels: { primary: "Brand purple", secondary: "Soft purple" },
  },
  blueprint: {
    primary: "#4a9eff",
    secondary: "#b8d4ff",
    labels: { primary: "Blueprint blue", secondary: "Line color" },
  },
  hologram: {
    primary: "#ff71ce",
    secondary: "#01cdfe",
    tertiary: "#05ffa1",
    labels: { primary: "Gradient start", secondary: "Gradient mid", tertiary: "Gradient end" },
  },
  aurora: {
    primary: "#7850ff",
    secondary: "#00dcb4",
    tertiary: "#ff64c8",
    labels: { primary: "Violet", secondary: "Teal", tertiary: "Pink" },
  },
  retro: {
    primary: "#000080",
    secondary: "#1084d0",
    labels: { primary: "Title bar", secondary: "Active blue" },
  },
  comic: {
    primary: "#fef08a",
    labels: { primary: "Frame yellow" },
  },
  cyberpunk: {
    primary: "#ff0080",
    secondary: "#00dfd8",
    inheritPrimary: true,
    labels: { primary: "Neon pink", secondary: "Neon cyan" },
  },
  neon: {
    primary: "#a855f7",
    inheritPrimary: true,
    labels: { primary: "Neon glow" },
  },
};

export function layoutSupportsColorCustomization(layout: ProfileLayout): boolean {
  return layout in LAYOUT_COLOR_CONFIG;
}

export function getLayoutColorConfig(layout: ProfileLayout): LayoutColorConfig | null {
  return LAYOUT_COLOR_CONFIG[layout] ?? null;
}

export function getLayoutColorSlotLabel(layout: ProfileLayout, slot: LayoutColorSlotKey): string {
  const config = LAYOUT_COLOR_CONFIG[layout];
  const defaults: Record<LayoutColorSlotKey, string> = {
    primary: "Primary color",
    secondary: "Secondary color",
    tertiary: "Tertiary color",
  };
  return config?.labels?.[slot] ?? defaults[slot];
}

export function layoutColorSlots(layout: ProfileLayout): LayoutColorSlotKey[] {
  const config = LAYOUT_COLOR_CONFIG[layout];
  if (!config) return [];
  const slots: LayoutColorSlotKey[] = ["primary"];
  if (config.secondary !== undefined || config.inheritSecondary || config.labels?.secondary) {
    slots.push("secondary");
  }
  if (config.tertiary !== undefined || config.labels?.tertiary) {
    slots.push("tertiary");
  }
  return slots;
}

export function getLayoutColorSlotDefault(
  settings: Pick<
    ProfileSettings,
    "layout" | "accent_color" | "gradient_colors" | "layout_primary_color" | "layout_secondary_color" | "layout_tertiary_color"
  >,
  slot: LayoutColorSlotKey,
): string {
  const config = LAYOUT_COLOR_CONFIG[settings.layout];
  if (!config) return settings.accent_color;

  if (slot === "primary") {
    if (config.inheritPrimary) return settings.accent_color;
    return config.primary;
  }
  if (slot === "secondary") {
    if (config.inheritSecondary) {
      return settings.gradient_colors?.[1] ?? settings.accent_color;
    }
    return config.secondary ?? config.primary;
  }
  return config.tertiary ?? config.secondary ?? config.primary;
}

export function resolveLayoutColors(
  settings: Pick<
    ProfileSettings,
    "layout" | "accent_color" | "gradient_colors" | "layout_primary_color" | "layout_secondary_color" | "layout_tertiary_color"
  >,
): ResolvedLayoutColors {
  const config = LAYOUT_COLOR_CONFIG[settings.layout];
  if (!config) {
    return {
      primary: settings.accent_color,
      secondary: settings.gradient_colors?.[1] ?? settings.accent_color,
      tertiary: settings.gradient_colors?.[2] ?? settings.gradient_colors?.[1] ?? settings.accent_color,
    };
  }

  const primary =
    settings.layout_primary_color?.trim() ||
    (config.inheritPrimary ? settings.accent_color : config.primary);
  const secondary =
    settings.layout_secondary_color?.trim() ||
    (config.inheritSecondary
      ? settings.gradient_colors?.[1] ?? settings.accent_color
      : config.secondary ?? config.primary);
  const tertiary =
    settings.layout_tertiary_color?.trim() || config.tertiary || secondary;

  return { primary, secondary, tertiary };
}

export function layoutColorStyle(settings: ProfileSettings): CSSProperties {
  const colors = resolveLayoutColors(settings);
  return {
    "--bf-layout-primary": colors.primary,
    "--bf-layout-secondary": colors.secondary,
    "--bf-layout-tertiary": colors.tertiary,
  } as CSSProperties;
}

export function colorAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  if (!normalized.startsWith("#")) return normalized;
  const hex = normalized.slice(1);
  if (hex.length !== 6 && hex.length !== 3) return normalized;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return normalized;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function readLayoutColorOverride(
  stored: string,
  settings: ProfileSettings,
  slot: LayoutColorSlotKey,
): string {
  const trimmed = stored?.trim();
  if (trimmed) return trimmed;
  return getLayoutColorSlotDefault(settings, slot);
}

export function writeLayoutColorOverride(
  next: string,
  settings: ProfileSettings,
  slot: LayoutColorSlotKey,
): string {
  const defaultColor = getLayoutColorSlotDefault(settings, slot);
  return next.trim().toLowerCase() === defaultColor.trim().toLowerCase() ? "" : next.trim();
}

/** Layouts with a decorative outer border/frame that can be hidden. */
export const LAYOUTS_WITH_REMOVABLE_BORDER = new Set<ProfileLayout>([
  "monarch",
  "glitch",
  "arcade",
  "passport",
  "cassette",
  "crystal",
  "nebuladrift",
  "monolith",
  "dashboard",
  "command",
  "bloom",
  "stealth",
  "emberforge",
  "matrix",
  "tapewave",
  "phoenix",
  "supernova",
  "neon",
  "hologram",
  "brutalist",
  "blueprint",
  "comic",
  "manga",
  "idcard",
  "ticket",
  "newspaper",
  "discord",
  "card",
  "terminal",
  "gaming",
  "portfolio",
  "magazine",
  "bento",
  "sidebar",
  "polaroid",
  "cinematic",
  "showcase",
  "poster",
  "cyberpunk",
  "luxury",
  "receipt",
  "zine",
  "orbit",
  "wave",
  "mosaic",
  "aurora",
  "spotify",
  "spotlight",
  "vaporwave",
  "vinyl",
  "twitch",
  "festival",
  "runway",
  "samurai",
  "prismstack",
  "noir",
  "liquid",
  "retro",
]);

export function layoutSupportsBorderToggle(layout: ProfileLayout): boolean {
  return LAYOUTS_WITH_REMOVABLE_BORDER.has(layout);
}

export function layoutHideBorderActive(
  settings: Pick<ProfileSettings, "layout" | "layout_hide_border">,
): boolean {
  return settings.layout_hide_border && layoutSupportsBorderToggle(settings.layout);
}

export function layoutRootClass(settings: ProfileSettings, className: string): string {
  if (!layoutSupportsBorderToggle(settings.layout)) return className;
  return `${className} bf-layout-removable-border`.trim();
}

export function layoutPanelSupported(layout: ProfileLayout): boolean {
  return layoutSupportsColorCustomization(layout) || layoutSupportsBorderToggle(layout);
}
