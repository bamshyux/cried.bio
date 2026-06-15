/** Placeholder usernames saved before real profile data was resolved. */
export function isPlaceholderDiscordUsername(username: string): boolean {
  return /^Discord #\d{4}$/i.test(username.trim());
}

export function getEffectiveDiscordUsername(username?: string): string {
  const trimmed = username?.trim() ?? "";
  if (!trimmed || isPlaceholderDiscordUsername(trimmed)) return "";
  return trimmed;
}

export function resolveDiscordDisplayName(
  settings: { discord_username?: string },
  presence: { username: string },
): string {
  const stored = getEffectiveDiscordUsername(settings.discord_username);
  const live = getEffectiveDiscordUsername(presence.username);
  return live || stored || presence.username || "Discord";
}
