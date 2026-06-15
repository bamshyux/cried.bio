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

export function getDiscordAvatarUrl(userId: string, avatarHash?: string | null) {
  if (avatarHash) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
  }
  const index = Number(BigInt(userId) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
