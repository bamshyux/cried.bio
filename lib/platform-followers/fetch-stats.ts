import type { SocialPlatformId } from "@/lib/social-platforms";
import type { PlatformStatFetchResult } from "@/lib/types/link-platform-stats";
import { extractPlatformUsername } from "@/lib/platform-followers/parse-link";

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function emptyResult(label = "Followers"): PlatformStatFetchResult {
  return {
    platform_username: null,
    display_name: null,
    avatar_url: null,
    follower_count: null,
    count_label: label,
  };
}

async function fetchGitHubStats(username: string): Promise<PlatformStatFetchResult> {
  const data = await fetchJson<{
    login?: string;
    name?: string;
    avatar_url?: string;
    followers?: number;
  }>(`https://api.github.com/users/${encodeURIComponent(username)}`);

  if (!data?.login) return emptyResult();

  return {
    platform_username: data.login,
    display_name: data.name ?? data.login,
    avatar_url: data.avatar_url ?? null,
    follower_count: typeof data.followers === "number" ? data.followers : null,
    count_label: "Followers",
  };
}

async function fetchKickStats(username: string): Promise<PlatformStatFetchResult> {
  const data = await fetchJson<{
    slug?: string;
    followers_count?: number;
    user?: { username?: string; profile_pic?: string };
  }>(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`);

  if (!data?.slug) return emptyResult();

  return {
    platform_username: data.user?.username ?? data.slug,
    display_name: data.user?.username ?? data.slug,
    avatar_url: data.user?.profile_pic ?? null,
    follower_count: typeof data.followers_count === "number" ? data.followers_count : null,
    count_label: "Followers",
  };
}

async function fetchDiscordInviteStats(code: string): Promise<PlatformStatFetchResult> {
  const data = await fetchJson<{
    code?: string;
    guild?: { name?: string; icon?: string; id?: string };
    profile?: { name?: string; icon?: string };
    approximate_member_count?: number;
  }>(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`);

  if (!data?.code) return emptyResult("Members");

  const guild = data.guild;
  const profile = data.profile;
  const name = guild?.name ?? profile?.name ?? code;
  let avatarUrl: string | null = null;

  if (guild?.icon && guild.id) {
    avatarUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  } else if (profile?.icon) {
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${profile.icon}.png`;
  }

  return {
    platform_username: code,
    display_name: name,
    avatar_url: avatarUrl,
    follower_count:
      typeof data.approximate_member_count === "number" ? data.approximate_member_count : null,
    count_label: "Members",
  };
}

async function getTwitchAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTwitchStats(username: string): Promise<PlatformStatFetchResult> {
  const clientId = process.env.TWITCH_CLIENT_ID?.trim();
  const token = await getTwitchAppToken();
  if (!clientId || !token) return emptyResult();

  const users = await fetchJson<{ data?: Array<{ id?: string; login?: string; display_name?: string; profile_image_url?: string }> }>(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const user = users?.data?.[0];
  if (!user?.id) return emptyResult();

  const followers = await fetchJson<{ total?: number }>(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${encodeURIComponent(user.id)}&first=1`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return {
    platform_username: user.login ?? username,
    display_name: user.display_name ?? user.login ?? username,
    avatar_url: user.profile_image_url ?? null,
    follower_count: typeof followers?.total === "number" ? followers.total : null,
    count_label: "Followers",
  };
}

async function fetchYouTubeStats(handle: string): Promise<PlatformStatFetchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return emptyResult("Subscribers");

  const normalized = handle.startsWith("@") ? handle : `@${handle}`;
  const data = await fetchJson<{
    items?: Array<{
      snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } };
      statistics?: { subscriberCount?: string };
    }>;
  }>(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(normalized)}&key=${encodeURIComponent(apiKey)}`,
  );

  const channel = data?.items?.[0];
  if (!channel) return emptyResult("Subscribers");

  const subscribers = channel.statistics?.subscriberCount
    ? Number.parseInt(channel.statistics.subscriberCount, 10)
    : null;

  return {
    platform_username: channel.snippet?.customUrl?.replace(/^@/, "") ?? handle.replace(/^@/, ""),
    display_name: channel.snippet?.title ?? handle,
    avatar_url: channel.snippet?.thumbnails?.default?.url ?? null,
    follower_count: Number.isFinite(subscribers ?? NaN) ? subscribers : null,
    count_label: "Subscribers",
  };
}

async function fetchTikTokStats(username: string): Promise<PlatformStatFetchResult> {
  const html = await fetchText(`https://www.tiktok.com/@${encodeURIComponent(username)}`);
  if (!html) return emptyResult();

  const followerMatch =
    html.match(/"followerCount":(\d+)/) ??
    html.match(/"fans":(\d+)/) ??
    html.match(/followers[^0-9]*([0-9][0-9,]+)/i);

  const avatarMatch = html.match(/"avatarLarger":"([^"]+)"/) ?? html.match(/"avatarMedium":"([^"]+)"/);
  const nicknameMatch = html.match(/"nickname":"([^"]+)"/);

  const followerRaw = followerMatch?.[1]?.replace(/,/g, "");
  const followerCount = followerRaw ? Number.parseInt(followerRaw, 10) : null;

  return {
    platform_username: username,
    display_name: nicknameMatch?.[1] ?? username,
    avatar_url: avatarMatch?.[1]?.replace(/\\u002F/g, "/") ?? null,
    follower_count: Number.isFinite(followerCount ?? NaN) ? followerCount : null,
    count_label: "Followers",
  };
}

async function fetchInstagramStats(username: string): Promise<PlatformStatFetchResult> {
  const html = await fetchText(`https://www.instagram.com/${encodeURIComponent(username)}/`);
  if (!html) return emptyResult();

  const followerMatch =
    html.match(/"edge_followed_by":\{"count":(\d+)\}/) ??
    html.match(/"follower_count":(\d+)/);

  const avatarMatch = html.match(/"profile_pic_url":"([^"]+)"/);
  const nameMatch = html.match(/"full_name":"([^"]*)"/);

  const followerCount = followerMatch?.[1] ? Number.parseInt(followerMatch[1], 10) : null;

  return {
    platform_username: username,
    display_name: nameMatch?.[1] || username,
    avatar_url: avatarMatch?.[1]?.replace(/\\u0026/g, "&") ?? null,
    follower_count: Number.isFinite(followerCount ?? NaN) ? followerCount : null,
    count_label: "Followers",
  };
}

async function fetchTwitterStats(username: string): Promise<PlatformStatFetchResult> {
  const bearer = process.env.X_BEARER_TOKEN?.trim();
  if (!bearer) return emptyResult();

  const data = await fetchJson<{
    data?: {
      username?: string;
      name?: string;
      profile_image_url?: string;
      public_metrics?: { followers_count?: number };
    };
  }>(`https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics,profile_image_url`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });

  const user = data?.data;
  if (!user?.username) return emptyResult();

  return {
    platform_username: user.username,
    display_name: user.name ?? user.username,
    avatar_url: user.profile_image_url ?? null,
    follower_count: user.public_metrics?.followers_count ?? null,
    count_label: "Followers",
  };
}

export async function fetchPlatformStats(
  platformId: SocialPlatformId,
  url: string,
): Promise<PlatformStatFetchResult> {
  const username = extractPlatformUsername(url, platformId);
  if (!username) return emptyResult();

  switch (platformId) {
    case "github":
      return fetchGitHubStats(username);
    case "kick":
      return fetchKickStats(username);
    case "discord":
      return fetchDiscordInviteStats(username);
    case "twitch":
      return fetchTwitchStats(username);
    case "youtube":
      return fetchYouTubeStats(username);
    case "tiktok":
      return fetchTikTokStats(username);
    case "instagram":
      return fetchInstagramStats(username);
    case "twitter":
      return fetchTwitterStats(username);
    default:
      return emptyResult();
  }
}
