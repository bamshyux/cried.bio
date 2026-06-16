export type DiscordCardStyle = "discord" | "minimal" | "compact" | "pill";

export type DiscordCardTheme =
  | "discord_dark"
  | "glass"
  | "neon"
  | "accent"
  | "midnight";

export type DiscordCardRadius = "sharp" | "soft" | "round" | "pill";

export type DiscordCardWidth = "narrow" | "default" | "wide" | "full";

export type DiscordHeaderLayout = "row" | "centered" | "stacked";

export type DiscordTextAlign = "left" | "center" | "right";

export type DiscordCardAlign = "inherit" | "left" | "center" | "right";

export type DiscordAvatarSize = "small" | "medium" | "large" | "xlarge";

export type DiscordAvatarShape = "circle" | "rounded" | "square";

export type DiscordCardConfig = {
  style: DiscordCardStyle;
  theme: DiscordCardTheme;
  show_lanyard_hint: boolean;
  accent_color: string;
  background_color: string;
  background_opacity: number;
  border_color: string;
  border_width: number;
  border_radius: DiscordCardRadius;
  card_width: DiscordCardWidth;
  show_avatar: boolean;
  show_status_text: boolean;
  show_activity: boolean;
  glow: boolean;
  backdrop_blur: boolean;
  header_layout: DiscordHeaderLayout;
  text_align: DiscordTextAlign;
  card_align: DiscordCardAlign;
  avatar_size: DiscordAvatarSize;
  avatar_shape: DiscordAvatarShape;
  show_status_dot: boolean;
  primary_text_color: string;
  secondary_text_color: string;
  font_family: string;
  name_font_size: number;
  status_font_size: number;
  header_gap: number;
  padding_x: number;
  padding_y: number;
};

export const DEFAULT_DISCORD_CARD_CONFIG: DiscordCardConfig = {
  style: "discord",
  theme: "discord_dark",
  show_lanyard_hint: false,
  accent_color: "",
  background_color: "",
  background_opacity: 100,
  border_color: "",
  border_width: 1,
  border_radius: "soft",
  card_width: "default",
  show_avatar: true,
  show_status_text: true,
  show_activity: true,
  glow: false,
  backdrop_blur: false,
  header_layout: "row",
  text_align: "left",
  card_align: "inherit",
  avatar_size: "medium",
  avatar_shape: "circle",
  show_status_dot: true,
  primary_text_color: "",
  secondary_text_color: "",
  font_family: "",
  name_font_size: 0,
  status_font_size: 0,
  header_gap: 12,
  padding_x: 12,
  padding_y: 0,
};
