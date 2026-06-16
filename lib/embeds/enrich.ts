import type { EmbedConfig, EmbedType, ParsedEmbed } from "@/lib/types/embed";
import { getDefaultEmbedConfig, parseEmbedConfig } from "@/lib/embeds/config";
import { enrichRobloxProfileEmbed } from "@/lib/embeds/roblox-profile";

export { enrichRobloxProfileEmbed };

async function fetchRobloxUser(userId: string) {
  const res = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as { name?: string; displayName?: string };
}

async function fetchRobloxUserIdByUsername(username: string) {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: Array<{ id?: number; name?: string; requestedUsername?: string }>;
  };
  return json.data?.[0] ?? null;
}

async function fetchRobloxAvatarUrl(userId: string) {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return "";
  const json = (await res.json()) as { data?: Array<{ imageUrl?: string }> };
  return json.data?.[0]?.imageUrl ?? "";
}

async function fetchRobloxGameThumbnail(placeId: string) {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return "";
  const json = (await res.json()) as { data?: Array<{ imageUrl?: string }> };
  return json.data?.[0]?.imageUrl ?? "";
}

export async function buildInitialEmbedConfig(parsed: ParsedEmbed): Promise<EmbedConfig> {
  const config = getDefaultEmbedConfig(parsed.embed_type);

  if (parsed.embed_type === "roblox_profile") {
    const userId = /^\d+$/.test(parsed.embed_id) ? parsed.embed_id : null;
    let resolvedUserId = userId;
    let username = userId ? null : parsed.embed_id;

    if (!resolvedUserId && username) {
      const match = await fetchRobloxUserIdByUsername(username);
      if (match?.id) {
        resolvedUserId = String(match.id);
        username = match.name ?? username;
      }
    } else if (resolvedUserId) {
      const user = await fetchRobloxUser(resolvedUserId);
      username = user?.name ?? username;
    }

    if (resolvedUserId) {
      config.avatar_url = await fetchRobloxAvatarUrl(resolvedUserId);
    }

    config.username = username ?? "";
    config.display_name = username ?? "";
    config.custom_title = parsed.title;
    config.show_title = true;
    config.show_avatar = true;
    config.show_username = true;
    return config;
  }

  if (parsed.embed_type === "roblox") {
    config.thumbnail_url = await fetchRobloxGameThumbnail(parsed.embed_id);
    config.custom_title = parsed.title;
    config.show_title = true;
    config.show_thumbnail = true;
    return config;
  }

  return config;
}

export async function refreshEmbedMediaConfig(
  embedType: EmbedType,
  embedId: string,
  config: EmbedConfig,
): Promise<EmbedConfig> {
  const next = { ...config };

  if (embedType === "roblox_profile" && /^\d+$/.test(embedId)) {
    if (next.show_avatar && !next.avatar_url) {
      next.avatar_url = await fetchRobloxAvatarUrl(embedId);
    }
    if (!next.username) {
      const user = await fetchRobloxUser(embedId);
      next.username = user?.name ?? "";
      next.display_name = user?.displayName ?? user?.name ?? "";
    }
  }

  if (embedType === "roblox" && next.show_thumbnail && !next.thumbnail_url) {
    next.thumbnail_url = await fetchRobloxGameThumbnail(embedId);
  }

  return next;
}

export function mergeEmbedConfig(embedType: EmbedType, raw: unknown): EmbedConfig {
  return parseEmbedConfig(raw, embedType);
}
