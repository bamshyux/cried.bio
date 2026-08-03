import { getSiteUrl } from "@/lib/site";

export function getDiscordClientId() {
  return process.env.DISCORD_CLIENT_ID?.trim() ?? "";
}

export function getDiscordClientSecret() {
  return process.env.DISCORD_CLIENT_SECRET?.trim() ?? "";
}

export function isDiscordOAuthConfigured() {
  return Boolean(getDiscordClientId() && getDiscordClientSecret());
}

export function getDiscordRedirectUri() {
  return `${getSiteUrl()}/api/discord/callback`;
}

export function getDiscordBotToken() {
  return process.env.DISCORD_BOT_TOKEN?.trim() ?? "";
}

export function getDiscordGuildId() {
  return process.env.DISCORD_GUILD_ID?.trim() ?? "";
}

/** cried.bio Premium role in the community Discord server. */
export function getDiscordPremiumRoleId() {
  return process.env.DISCORD_PREMIUM_ROLE_ID?.trim() || "1515978784984272929";
}

export function isDiscordGuildRoleSyncConfigured() {
  return Boolean(getDiscordBotToken() && getDiscordGuildId() && getDiscordPremiumRoleId());
}

export function getDiscordAvatarUrl(userId: string, avatarHash?: string | null) {
  if (avatarHash) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
  }
  const index = Number(BigInt(userId) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
