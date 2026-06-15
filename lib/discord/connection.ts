import { getEffectiveDiscordUsername, isPlaceholderDiscordUsername } from "@/lib/discord/resolve-profile";

export function isValidDiscordUserId(userId: string): boolean {
  return /^\d{17,20}$/.test(userId.trim());
}

/** Account was linked via OAuth or manual save with a real username. */
export function isDiscordLinked(settings: {
  discord_user_id: string;
  discord_username?: string;
}): boolean {
  return (
    isValidDiscordUserId(settings.discord_user_id) &&
    Boolean(getEffectiveDiscordUsername(settings.discord_username))
  );
}

export function isDiscordConnected(settings: {
  discord_user_id: string;
  discord_username?: string;
}): boolean {
  return isDiscordLinked(settings);
}

export function needsDiscordProfileRefresh(settings: {
  discord_user_id: string;
  discord_username?: string;
}): boolean {
  if (!isValidDiscordUserId(settings.discord_user_id)) return false;
  const username = settings.discord_username?.trim() ?? "";
  return !username || isPlaceholderDiscordUsername(username);
}
