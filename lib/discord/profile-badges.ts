import type { DiscordGuildTag, DiscordProfileBadges, HypeSquadHouse } from "@/lib/discord/types";

const HYPESQUAD_BRAVERY = 1 << 6;
const HYPESQUAD_BRILLIANCE = 1 << 7;
const HYPESQUAD_BALANCE = 1 << 8;

export const EMPTY_DISCORD_PROFILE_BADGES: DiscordProfileBadges = {
  guildTag: null,
  nitro: false,
  hypesquad: null,
};

export type DiscordDisplayNameStyles = {
  display_name_font_id?: number | null;
  display_name_effect_id?: number | null;
  display_name_colors?: number[] | null;
};

export type DiscordBadgeHints = {
  premiumType?: number | null;
  avatar?: string | null;
  banner?: string | null;
  displayNameStyles?: DiscordDisplayNameStyles | null;
};

type LanyardGuildIdentity = {
  tag?: string | null;
  badge?: string | null;
  identity_guild_id?: string | null;
  identity_enabled?: boolean | null;
};

type LanyardAvatarDecoration = {
  asset?: string | null;
  sku_id?: string | null;
};

type LanyardCollectibles = {
  nameplate?: {
    asset?: string | null;
    sku_id?: string | null;
  } | null;
};

export type LanyardDiscordUser = {
  avatar?: string | null;
  banner?: string | null;
  public_flags?: number | null;
  flags?: number | null;
  premium_type?: number | null;
  avatar_decoration_data?: LanyardAvatarDecoration | null;
  collectibles?: LanyardCollectibles | null;
  display_name_styles?: DiscordDisplayNameStyles | null;
  primary_guild?: LanyardGuildIdentity | null;
  clan?: LanyardGuildIdentity | null;
};

export type NitroSignalInput = {
  premiumType?: number | null;
  avatar?: string | null;
  banner?: string | null;
  displayNameStyles?: DiscordDisplayNameStyles | null;
};

export function getGuildTagBadgeUrl(guildId: string, badgeHash: string, size = 32): string {
  return `https://cdn.discordapp.com/guild-tag-badges/${guildId}/${badgeHash}.png?size=${size}`;
}

function readPublicFlags(user: LanyardDiscordUser): number {
  const raw = user.public_flags ?? user.flags ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHypeSquadHouse(publicFlags: number): HypeSquadHouse | null {
  if (publicFlags & HYPESQUAD_BRAVERY) return "bravery";
  if (publicFlags & HYPESQUAD_BRILLIANCE) return "brilliance";
  if (publicFlags & HYPESQUAD_BALANCE) return "balance";
  return null;
}

function parseGuildTag(identity: LanyardGuildIdentity | null | undefined): DiscordGuildTag | null {
  if (!identity) return null;
  if (identity.identity_enabled === false) return null;

  const tag = identity.tag?.trim();
  const guildId = identity.identity_guild_id?.trim();
  const badgeHash = identity.badge?.trim();

  if (!tag || !guildId || !badgeHash) return null;

  return {
    tag,
    guildId,
    badgeUrl: getGuildTagBadgeUrl(guildId, badgeHash, 32),
  };
}

function hasPremiumType(premiumType: number | null | undefined): boolean {
  const parsed = Number(premiumType ?? 0);
  return Number.isFinite(parsed) && parsed > 0;
}

function hasAnimatedAvatar(avatar: string | null | undefined): boolean {
  return Boolean(avatar?.startsWith("a_"));
}

function hasProfileBanner(banner: string | null | undefined): boolean {
  return Boolean(banner?.trim());
}

/** Saved display name styles are a Nitro-only profile feature on Discord. */
export function hasDisplayNameStyles(
  styles: DiscordDisplayNameStyles | null | undefined,
): boolean {
  if (!styles || typeof styles !== "object") return false;

  const fontId = Number(styles.display_name_font_id ?? 0);
  const effectId = Number(styles.display_name_effect_id ?? 0);
  const colors = styles.display_name_colors;

  if (Number.isFinite(fontId) && fontId > 0) return true;
  if (Number.isFinite(effectId) && effectId > 0) return true;
  if (Array.isArray(colors) && colors.length > 0) return true;
  return false;
}

export function collectNitroSignals(input: NitroSignalInput): NitroSignalInput {
  return {
    premiumType: input.premiumType,
    avatar: input.avatar,
    banner: input.banner,
    displayNameStyles: input.displayNameStyles,
  };
}

export function collectNitroSignalsFromUser(user: LanyardDiscordUser | null | undefined): NitroSignalInput {
  if (!user) {
    return collectNitroSignals({});
  }

  return collectNitroSignals({
    premiumType: user.premium_type,
    avatar: user.avatar,
    banner: user.banner,
    displayNameStyles: user.display_name_styles,
  });
}

/** Infer a storable premium_type from Discord API or Lanyard-visible signals. */
export function inferPremiumTypeFromProfileSignals(input: NitroSignalInput): number {
  if (hasPremiumType(input.premiumType)) return Number(input.premiumType);
  if (hasAnimatedAvatar(input.avatar) || hasProfileBanner(input.banner)) return 2;
  if (hasDisplayNameStyles(input.displayNameStyles)) return 2;
  return 0;
}

export function hasDiscordNitroFromSignals(input: NitroSignalInput): boolean {
  return inferPremiumTypeFromProfileSignals(input) > 0;
}

function parseNitro(user: LanyardDiscordUser): boolean {
  return hasDiscordNitroFromSignals(collectNitroSignalsFromUser(user));
}

export function hasDiscordNitroFromHints(hints: DiscordBadgeHints | null | undefined): boolean {
  if (!hints) return false;
  return hasDiscordNitroFromSignals(hints);
}

export function mergeDiscordProfileBadges(
  badges: DiscordProfileBadges,
  hints?: DiscordBadgeHints,
): DiscordProfileBadges {
  const nitro = badges.nitro || hasDiscordNitroFromHints(hints);
  if (nitro === badges.nitro) return badges;

  return {
    ...badges,
    nitro,
  };
}

export function parseDiscordProfileBadges(user: LanyardDiscordUser | null | undefined): DiscordProfileBadges {
  if (!user) return EMPTY_DISCORD_PROFILE_BADGES;

  const publicFlags = readPublicFlags(user);
  const guildIdentity = user.primary_guild ?? user.clan ?? null;

  return {
    guildTag: parseGuildTag(guildIdentity),
    nitro: parseNitro(user),
    hypesquad: parseHypeSquadHouse(publicFlags),
  };
}

export function hasDiscordProfileBadges(badges: DiscordProfileBadges): boolean {
  return Boolean(badges.guildTag?.tag || badges.nitro || badges.hypesquad);
}

export function getDiscordBadgeHintsFromSettings(settings: {
  discord_premium_type?: number | null;
  discord_avatar?: string | null;
  discord_banner?: string | null;
}): DiscordBadgeHints {
  return {
    premiumType: settings.discord_premium_type,
    avatar: settings.discord_avatar,
    banner: settings.discord_banner,
  };
}
