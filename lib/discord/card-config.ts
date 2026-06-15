import {
  DEFAULT_DISCORD_CARD_CONFIG,
  type DiscordCardConfig,
  type DiscordCardStyle,
} from "@/lib/types/discord-widget";
import type { ProfileSettings } from "@/lib/types/settings";

export function parseDiscordCardConfig(raw: unknown): DiscordCardConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_DISCORD_CARD_CONFIG;
  const config = raw as Record<string, unknown>;
  const style = config.style;
  const showHint = config.show_lanyard_hint;

  return {
    style:
      style === "minimal" || style === "compact" || style === "discord"
        ? style
        : DEFAULT_DISCORD_CARD_CONFIG.style,
    show_lanyard_hint: showHint === true,
  };
}

export function applyDiscordCardConfig(
  settings: ProfileSettings,
  config: DiscordCardConfig,
): ProfileSettings {
  return {
    ...settings,
    discord_card_style: config.style,
    discord_show_lanyard_hint: config.show_lanyard_hint,
  };
}

export function getDiscordCardStyleLabel(style: DiscordCardStyle): string {
  switch (style) {
    case "minimal":
      return "Minimal";
    case "compact":
      return "Compact";
    default:
      return "Discord (default)";
  }
}
