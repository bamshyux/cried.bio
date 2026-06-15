export function isValidDiscordUserId(userId: string): boolean {
  return /^\d{17,20}$/.test(userId.trim());
}

export function isDiscordConnected(settings: {
  discord_user_id: string;
}): boolean {
  return isValidDiscordUserId(settings.discord_user_id);
}
