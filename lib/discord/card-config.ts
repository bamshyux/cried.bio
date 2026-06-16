import {
  DEFAULT_DISCORD_CARD_CONFIG,
  type DiscordAvatarShape,
  type DiscordAvatarSize,
  type DiscordCardAlign,
  type DiscordCardConfig,
  type DiscordCardRadius,
  type DiscordCardStyle,
  type DiscordCardTheme,
  type DiscordCardWidth,
  type DiscordHeaderLayout,
  type DiscordTextAlign,
} from "@/lib/types/discord-widget";
import type { ProfileSettings } from "@/lib/types/settings";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseStyle(value: unknown): DiscordCardStyle {
  if (value === "minimal" || value === "compact" || value === "pill" || value === "discord") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.style;
}

function parseTheme(value: unknown): DiscordCardTheme {
  if (
    value === "glass" ||
    value === "neon" ||
    value === "accent" ||
    value === "midnight" ||
    value === "discord_dark"
  ) {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.theme;
}

function parseRadius(value: unknown): DiscordCardRadius {
  if (value === "sharp" || value === "round" || value === "pill" || value === "soft") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.border_radius;
}

function parseWidth(value: unknown): DiscordCardWidth {
  if (value === "narrow" || value === "wide" || value === "full" || value === "default") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.card_width;
}

function parseHeaderLayout(value: unknown): DiscordHeaderLayout {
  if (value === "row" || value === "centered" || value === "stacked") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.header_layout;
}

function parseTextAlign(value: unknown): DiscordTextAlign {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.text_align;
}

function parseCardAlign(value: unknown): DiscordCardAlign {
  if (value === "inherit" || value === "left" || value === "center" || value === "right") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.card_align;
}

function parseAvatarSize(value: unknown): DiscordAvatarSize {
  if (value === "small" || value === "medium" || value === "large" || value === "xlarge") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.avatar_size;
}

function parseAvatarShape(value: unknown): DiscordAvatarShape {
  if (value === "circle" || value === "rounded" || value === "square") {
    return value;
  }
  return DEFAULT_DISCORD_CARD_CONFIG.avatar_shape;
}

function parseColor(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : "";
}

function parseFontFamily(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length <= 64 ? trimmed : "";
}

export function parseDiscordCardConfig(raw: unknown): DiscordCardConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_DISCORD_CARD_CONFIG };
  const config = raw as Record<string, unknown>;

  return {
    style: parseStyle(config.style),
    theme: parseTheme(config.theme),
    show_lanyard_hint: config.show_lanyard_hint === true,
    accent_color: parseColor(config.accent_color),
    background_color: parseColor(config.background_color),
    background_opacity: clamp(Number(config.background_opacity ?? 100), 0, 100),
    border_color: parseColor(config.border_color),
    border_width: clamp(Number(config.border_width ?? 1), 0, 3),
    border_radius: parseRadius(config.border_radius),
    card_width: parseWidth(config.card_width),
    show_avatar: config.show_avatar !== false,
    show_status_text: config.show_status_text !== false,
    show_activity: config.show_activity !== false,
    glow: config.glow === true,
    backdrop_blur: config.backdrop_blur === true,
    header_layout: parseHeaderLayout(config.header_layout),
    text_align: parseTextAlign(config.text_align),
    card_align: parseCardAlign(config.card_align),
    avatar_size: parseAvatarSize(config.avatar_size),
    avatar_shape: parseAvatarShape(config.avatar_shape),
    show_status_dot: config.show_status_dot !== false,
    primary_text_color: parseColor(config.primary_text_color),
    secondary_text_color: parseColor(config.secondary_text_color),
    font_family: parseFontFamily(config.font_family),
    name_font_size: clamp(Number(config.name_font_size ?? 0), 0, 28),
    status_font_size: clamp(Number(config.status_font_size ?? 0), 0, 22),
    header_gap: clamp(Number(config.header_gap ?? 12), 4, 32),
    padding_x: clamp(Number(config.padding_x ?? 12), 0, 32),
    padding_y: clamp(Number(config.padding_y ?? 0), 0, 32),
  };
}

export function configFromProfileSettings(settings: ProfileSettings): DiscordCardConfig {
  if (settings.discord_card_config) return parseDiscordCardConfig(settings.discord_card_config);
  return parseDiscordCardConfig({
    style: settings.discord_card_style,
    show_lanyard_hint: settings.discord_show_lanyard_hint,
  });
}

export function applyDiscordCardConfig(
  settings: ProfileSettings,
  config: DiscordCardConfig,
): ProfileSettings {
  const parsed = parseDiscordCardConfig(config);
  return {
    ...settings,
    discord_card_config: parsed,
    discord_card_style: parsed.style,
    discord_show_lanyard_hint: parsed.show_lanyard_hint,
  };
}

export function getDiscordCardStyleLabel(style: DiscordCardStyle): string {
  switch (style) {
    case "minimal":
      return "Minimal";
    case "compact":
      return "Compact";
    case "pill":
      return "Pill";
    default:
      return "Discord";
  }
}

export function getDiscordCardThemeLabel(theme: DiscordCardTheme): string {
  switch (theme) {
    case "glass":
      return "Glass";
    case "neon":
      return "Neon";
    case "accent":
      return "Profile accent";
    case "midnight":
      return "Midnight";
    default:
      return "Discord dark";
  }
}

export function getDiscordHeaderLayoutLabel(layout: DiscordHeaderLayout): string {
  switch (layout) {
    case "centered":
      return "Avatar on top";
    case "stacked":
      return "Stacked left";
    default:
      return "Avatar left";
  }
}

export function getDiscordTextAlignLabel(align: DiscordTextAlign): string {
  switch (align) {
    case "center":
      return "Center";
    case "right":
      return "Right";
    default:
      return "Left";
  }
}

export function getDiscordCardAlignLabel(align: DiscordCardAlign): string {
  switch (align) {
    case "left":
      return "Left";
    case "center":
      return "Center";
    case "right":
      return "Right";
    default:
      return "Follow profile";
  }
}

export function getDiscordAvatarSizeLabel(size: DiscordAvatarSize): string {
  switch (size) {
    case "small":
      return "Small";
    case "large":
      return "Large";
    case "xlarge":
      return "Extra large";
    default:
      return "Medium";
  }
}

export function getDiscordAvatarShapeLabel(shape: DiscordAvatarShape): string {
  switch (shape) {
    case "rounded":
      return "Rounded";
    case "square":
      return "Square";
    default:
      return "Circle";
  }
}
