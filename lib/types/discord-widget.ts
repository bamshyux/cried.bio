export type DiscordCardStyle = "discord" | "minimal" | "compact";

export type DiscordCardConfig = {
  style: DiscordCardStyle;
  show_lanyard_hint: boolean;
};

export const DEFAULT_DISCORD_CARD_CONFIG: DiscordCardConfig = {
  style: "discord",
  show_lanyard_hint: false,
};
