import type { CSSProperties } from "react";
import type { EmbedConfig, EmbedType } from "@/lib/types/embed";

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  display_mode: "iframe",
  aspect_ratio: "16:9",
  card_style: "default",
  alignment: "stretch",
  show_title: false,
  custom_title: "",
  description: "",
  accent_color: "",
  background_color: "",
  border_radius: 12,
  show_border: true,
  border_color: "",
  theme: "dark",
  compact_player: false,
  autoplay: false,
  show_avatar: true,
  show_username: true,
  show_stats: false,
  show_thumbnail: true,
  avatar_url: "",
  thumbnail_url: "",
  username: "",
  display_name: "",
};

const TYPE_DEFAULTS: Partial<Record<EmbedType, Partial<EmbedConfig>>> = {
  roblox_profile: {
    display_mode: "card",
    card_style: "default",
    show_title: true,
    show_avatar: true,
    show_username: true,
    aspect_ratio: "auto",
  },
  roblox: {
    display_mode: "card",
    card_style: "default",
    show_title: true,
    show_thumbnail: true,
    aspect_ratio: "auto",
  },
  spotify_track: {
    display_mode: "iframe",
    compact_player: true,
    aspect_ratio: "auto",
    theme: "dark",
  },
  spotify_playlist: {
    display_mode: "iframe",
    compact_player: true,
    aspect_ratio: "auto",
    theme: "dark",
  },
  soundcloud: {
    display_mode: "iframe",
    compact_player: true,
    aspect_ratio: "auto",
    theme: "dark",
  },
  discord: {
    display_mode: "iframe",
    theme: "dark",
    aspect_ratio: "16:9",
  },
  tiktok: {
    aspect_ratio: "9:16",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseHex(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : "";
}

function parseEnum<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

export function getDefaultEmbedConfig(type: EmbedType): EmbedConfig {
  return {
    ...DEFAULT_EMBED_CONFIG,
    ...(TYPE_DEFAULTS[type] ?? {}),
  };
}

export function parseEmbedConfig(raw: unknown, type: EmbedType): EmbedConfig {
  const defaults = getDefaultEmbedConfig(type);
  if (!raw || typeof raw !== "object") return defaults;

  const value = raw as Record<string, unknown>;

  return {
    display_mode: parseEnum(value.display_mode, ["iframe", "card", "minimal"] as const, defaults.display_mode),
    aspect_ratio: parseEnum(
      value.aspect_ratio,
      ["16:9", "4:3", "1:1", "9:16", "auto"] as const,
      defaults.aspect_ratio,
    ),
    card_style: parseEnum(
      value.card_style,
      ["default", "minimal", "glass", "bordered"] as const,
      defaults.card_style,
    ),
    alignment: parseEnum(
      value.alignment,
      ["left", "center", "right", "stretch"] as const,
      defaults.alignment,
    ),
    show_title: parseBool(value.show_title, defaults.show_title),
    custom_title: parseString(value.custom_title).slice(0, 80),
    description: parseString(value.description).slice(0, 200),
    accent_color: parseHex(value.accent_color),
    background_color: parseHex(value.background_color),
    border_radius: clamp(typeof value.border_radius === "number" ? value.border_radius : defaults.border_radius, 0, 24),
    show_border: parseBool(value.show_border, defaults.show_border),
    border_color: parseHex(value.border_color),
    theme: parseEnum(value.theme, ["dark", "light"] as const, defaults.theme),
    compact_player: parseBool(value.compact_player, defaults.compact_player),
    autoplay: parseBool(value.autoplay, defaults.autoplay),
    show_avatar: parseBool(value.show_avatar, defaults.show_avatar),
    show_username: parseBool(value.show_username, defaults.show_username),
    show_stats: parseBool(value.show_stats, defaults.show_stats),
    show_thumbnail: parseBool(value.show_thumbnail, defaults.show_thumbnail),
    avatar_url: parseString(value.avatar_url).slice(0, 500),
    thumbnail_url: parseString(value.thumbnail_url).slice(0, 500),
    username: parseString(value.username).slice(0, 64),
    display_name: parseString(value.display_name).slice(0, 80),
  };
}

export function resolveEmbedTitle(embed: { title: string; config?: EmbedConfig | null }) {
  const config = embed.config ?? DEFAULT_EMBED_CONFIG;
  if (config.custom_title?.trim()) return config.custom_title.trim();
  return embed.title;
}

export function aspectRatioClass(ratio: EmbedConfig["aspect_ratio"]) {
  switch (ratio) {
    case "4:3":
      return "aspect-[4/3]";
    case "1:1":
      return "aspect-square";
    case "9:16":
      return "aspect-[9/16]";
    case "auto":
      return "";
    default:
      return "aspect-video";
  }
}

export function aspectRatioStyle(ratio: EmbedConfig["aspect_ratio"], compactPlayer: boolean) {
  if (ratio === "auto" && compactPlayer) {
    return { height: 152 };
  }
  if (ratio === "auto") {
    return { minHeight: 120 };
  }
  return undefined;
}

export function embedCardStyle(config: EmbedConfig, accentFallback: string) {
  const accent = config.accent_color || accentFallback;
  const background = config.background_color || "#0f0f0f";
  const borderColor = config.border_color || "rgba(255,255,255,0.08)";

  const base: CSSProperties = {
    borderRadius: config.border_radius,
    background,
  };

  switch (config.card_style) {
    case "minimal":
      return {
        ...base,
        background: config.background_color || "transparent",
        border: config.show_border ? `1px solid ${borderColor}` : "none",
      };
    case "glass":
      return {
        ...base,
        background: config.background_color || "rgba(15,15,15,0.55)",
        backdropFilter: "blur(12px)",
        border: config.show_border ? `1px solid ${borderColor}` : "none",
        boxShadow: `0 0 0 1px ${accent}14`,
      };
    case "bordered":
      return {
        ...base,
        border: config.show_border ? `2px solid ${accent}` : "none",
        boxShadow: `0 0 24px ${accent}18`,
      };
    default:
      return {
        ...base,
        border: config.show_border ? `1px solid ${borderColor}` : "none",
        boxShadow: `0 0 0 1px ${accent}10`,
      };
  }
}

export function embedAlignmentClass(alignment: EmbedConfig["alignment"]) {
  switch (alignment) {
    case "left":
      return "mr-auto max-w-md";
    case "center":
      return "mx-auto max-w-md";
    case "right":
      return "ml-auto max-w-md";
    default:
      return "w-full";
  }
}
