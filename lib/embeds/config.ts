import type { CSSProperties } from "react";
import type { EmbedConfig, EmbedType } from "@/lib/types/embed";

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  display_mode: "iframe",
  aspect_ratio: "16:9",
  card_style: "default",
  alignment: "stretch",
  show_title: false,
  show_description: true,
  custom_title: "",
  description: "",
  accent_color: "",
  background_color: "",
  text_color: "",
  border_radius: 12,
  border_width: 1,
  show_border: true,
  border_color: "",
  opacity: 100,
  blur: 0,
  padding: 16,
  margin_y: 0,
  max_width: 100,
  show_shadow: true,
  title_size: "md",
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
    show_description: parseBool(value.show_description, defaults.show_description),
    custom_title: parseString(value.custom_title).slice(0, 80),
    description: parseString(value.description).slice(0, 200),
    accent_color: parseHex(value.accent_color),
    background_color: parseHex(value.background_color),
    text_color: parseHex(value.text_color),
    border_radius: clamp(typeof value.border_radius === "number" ? value.border_radius : defaults.border_radius, 0, 24),
    border_width: clamp(typeof value.border_width === "number" ? value.border_width : defaults.border_width, 0, 4),
    show_border: parseBool(value.show_border, defaults.show_border),
    border_color: parseHex(value.border_color),
    opacity: clamp(typeof value.opacity === "number" ? value.opacity : defaults.opacity, 0, 100),
    blur: clamp(typeof value.blur === "number" ? value.blur : defaults.blur, 0, 40),
    padding: clamp(typeof value.padding === "number" ? value.padding : defaults.padding, 0, 32),
    margin_y: clamp(typeof value.margin_y === "number" ? value.margin_y : defaults.margin_y, 0, 48),
    max_width: clamp(typeof value.max_width === "number" ? value.max_width : defaults.max_width, 50, 100),
    show_shadow: parseBool(value.show_shadow, defaults.show_shadow),
    title_size: parseEnum(value.title_size, ["sm", "md", "lg"] as const, defaults.title_size),
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

export function embedAlignmentClass(alignment: EmbedConfig["alignment"]) {
  switch (alignment) {
    case "left":
      return "mr-auto";
    case "center":
      return "mx-auto";
    case "right":
      return "ml-auto";
    default:
      return "w-full";
  }
}

export function embedAlignmentStyle(config: EmbedConfig): CSSProperties {
  const width =
    config.alignment === "stretch" || config.max_width >= 100
      ? "100%"
      : `${config.max_width}%`;

  return {
    width,
    maxWidth: "100%",
    marginTop: config.margin_y,
    marginBottom: config.margin_y,
  };
}

export function embedTitleClass(size: EmbedConfig["title_size"]) {
  switch (size) {
    case "sm":
      return "text-xs font-medium";
    case "lg":
      return "text-base font-semibold";
    default:
      return "text-sm font-medium";
  }
}

function applyHexAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveEmbedBackground(config: EmbedConfig, fallback: string): string {
  const background = config.background_color || fallback;
  if (config.blur > 0 && background.startsWith("#")) {
    return applyHexAlpha(background, 0.55);
  }
  if (config.blur > 0 && !config.background_color) {
    return "rgba(15, 15, 15, 0.55)";
  }
  return background;
}

export function embedCardStyle(config: EmbedConfig, accentFallback: string) {
  const accent = config.accent_color || accentFallback;
  const borderColor = config.border_color || "rgba(255,255,255,0.08)";
  const borderWidth = config.show_border ? config.border_width : 0;
  const blur = Math.max(0, config.blur);

  const base: CSSProperties = {
    borderRadius: config.border_radius,
    opacity: config.opacity / 100,
    ...(blur > 0
      ? {
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }
      : {}),
  };

  const shadow = config.show_shadow ? `0 8px 32px rgba(0,0,0,0.35)` : "none";

  switch (config.card_style) {
    case "minimal":
      return {
        ...base,
        background: resolveEmbedBackground(
          config,
          config.background_color ? config.background_color : "transparent",
        ),
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
        boxShadow: config.show_shadow ? `0 0 0 1px ${borderColor}` : "none",
      };
    case "glass":
      return {
        ...base,
        background: resolveEmbedBackground(config, "rgba(15,15,15,0.55)"),
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
        boxShadow: config.show_shadow ? `0 0 0 1px ${accent}14, ${shadow}` : "none",
        ...(blur === 0
          ? {
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }
          : {}),
      };
    case "bordered":
      return {
        ...base,
        background: resolveEmbedBackground(config, "#0f0f0f"),
        border: borderWidth > 0 ? `${Math.max(borderWidth, 2)}px solid ${accent}` : "none",
        boxShadow: config.show_shadow ? `0 0 24px ${accent}18, ${shadow}` : "none",
      };
    default:
      return {
        ...base,
        background: resolveEmbedBackground(config, "#0f0f0f"),
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
        boxShadow: config.show_shadow ? `0 0 0 1px ${accent}10, ${shadow}` : "none",
      };
  }
}

export function embedTextStyle(config: EmbedConfig, settingsTextColor: string): CSSProperties {
  return config.text_color ? { color: config.text_color } : { color: settingsTextColor };
}

export function embedMutedTextStyle(config: EmbedConfig): CSSProperties {
  if (!config.text_color) return {};
  return { color: `${config.text_color}99` };
}

export function embedContentPadding(config: EmbedConfig): CSSProperties {
  return { padding: config.padding };
}
