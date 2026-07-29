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

async function fetchPlainText(url: string, init?: RequestInit): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/plain,*/*",
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.text()).trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCount(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
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
  const serverName = guild?.name ?? profile?.name ?? null;
  let avatarUrl: string | null = null;

  if (guild?.icon && guild.id) {
    avatarUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  } else if (profile?.icon) {
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${profile.icon}.png`;
  }

  return {
    platform_username: serverName ?? code,
    display_name: serverName ?? "Discord Server",
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
  const token = clientId ? await getTwitchAppToken() : null;

  if (clientId && token) {
    const users = await fetchJson<{
      data?: Array<{ id?: string; login?: string; display_name?: string; profile_image_url?: string }>;
    }>(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`, {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    const user = users?.data?.[0];
    if (user?.id) {
      const followers = await fetchJson<{ total?: number }>(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${encodeURIComponent(user.id)}&first=1`,
        {
          headers: {
            "Client-Id": clientId,
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (typeof followers?.total === "number") {
        return {
          platform_username: user.login ?? username,
          display_name: user.display_name ?? user.login ?? username,
          avatar_url: user.profile_image_url ?? null,
          follower_count: followers.total,
          count_label: "Followers",
        };
      }
    }
  }

  const [followCountRaw, avatarRaw] = await Promise.all([
    fetchPlainText(`https://decapi.me/twitch/followcount/${encodeURIComponent(username)}`),
    fetchPlainText(`https://decapi.me/twitch/avatar/${encodeURIComponent(username)}`),
  ]);

  const followerCount = parseCount(followCountRaw);
  if (followerCount == null) return emptyResult();

  return {
    platform_username: username,
    display_name: username,
    avatar_url: avatarRaw && avatarRaw.startsWith("http") ? avatarRaw : null,
    follower_count: followerCount,
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
  if (bearer) {
    const data = await fetchJson<{
      data?: {
        username?: string;
        name?: string;
        profile_image_url?: string;
        public_metrics?: { followers_count?: number };
      };
    }>(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics,profile_image_url`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );

    const user = data?.data;
    if (user?.username && user.public_metrics?.followers_count != null) {
      return {
        platform_username: user.username,
        display_name: user.name ?? user.username,
        avatar_url: user.profile_image_url ?? null,
        follower_count: user.public_metrics.followers_count,
        count_label: "Followers",
      };
    }
  }

  const html = await fetchText(`https://x.com/${encodeURIComponent(username)}`);
  if (!html) return emptyResult();

  const followerMatch =
    html.match(/"followers_count":(\d+)/) ??
    html.match(/"followers":\{"count":(\d+)\}/) ??
    html.match(/"normal_followers_count":(\d+)/);

  const nameMatch = html.match(/"name":"([^"]+)"/);
  const avatarMatch =
    html.match(/"profile_image_url_https":"([^"]+)"/) ??
    html.match(/"profile_image_url":"([^"]+)"/);

  const followerCount = followerMatch?.[1] ? Number.parseInt(followerMatch[1], 10) : null;

  return {
    platform_username: username,
    display_name: nameMatch?.[1]?.replace(/\\u0026/g, "&") ?? username,
    avatar_url: avatarMatch?.[1]?.replace(/\\u0026/g, "&") ?? null,
    follower_count: Number.isFinite(followerCount ?? NaN) ? followerCount : null,
    count_label: "Followers",
  };
}

async function resolveRobloxUserId(identifier: string): Promise<{ id: string; username: string } | null> {
  if (/^\d+$/.test(identifier)) {
    const profile = await fetchJson<{ name?: string }>(
      `https://users.roblox.com/v1/users/${encodeURIComponent(identifier)}`,
    );
    return {
      id: identifier,
      username: profile?.name ?? identifier,
    };
  }

  const lookup = await fetchJson<{
    data?: Array<{ id?: number; name?: string }>;
  }>("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [identifier], excludeBannedUsers: false }),
  });

  const match = lookup?.data?.[0];
  if (!match?.id) return null;

  return {
    id: String(match.id),
    username: match.name ?? identifier,
  };
}

async function fetchRobloxStats(identifier: string): Promise<PlatformStatFetchResult> {
  const user = await resolveRobloxUserId(identifier);
  if (!user) return emptyResult();

  const [followers, avatar] = await Promise.all([
    fetchJson<{ count?: number }>(
      `https://friends.roblox.com/v1/users/${encodeURIComponent(user.id)}/followers/count`,
    ),
    fetchJson<{ data?: Array<{ imageUrl?: string }> }>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(user.id)}&size=150x150&format=Png&isCircular=true`,
    ),
  ]);

  return {
    platform_username: user.username,
    display_name: user.username,
    avatar_url: avatar?.data?.[0]?.imageUrl ?? null,
    follower_count: typeof followers?.count === "number" ? followers.count : null,
    count_label: "Followers",
  };
}

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      body,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
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

async function fetchSpotifyStats(identifier: string, url: string): Promise<PlatformStatFetchResult> {
  const parsed = new URL(url);
  const kind = parsed.pathname.split("/").filter(Boolean)[0];
  const token = await getSpotifyAccessToken();

  if (token && kind === "artist") {
    const data = await fetchJson<{
      name?: string;
      followers?: { total?: number };
      images?: Array<{ url?: string }>;
    }>(`https://api.spotify.com/v1/artists/${encodeURIComponent(identifier)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data?.name) {
      return {
        platform_username: data.name,
        display_name: data.name,
        avatar_url: data.images?.[0]?.url ?? null,
        follower_count: data.followers?.total ?? null,
        count_label: "Followers",
      };
    }
  }

  const html = await fetchText(url);
  if (html) {
    const nameMatch = html.match(/"name":"([^"]+)"/);
    const followerMatch =
      html.match(/"followers":\{"total":(\d+)\}/) ??
      html.match(/"followers":\{"count":(\d+)\}/);
    const imageMatch = html.match(/"images":\[\{"url":"([^"]+)"/);

    const followerCount = followerMatch?.[1] ? Number.parseInt(followerMatch[1], 10) : null;
    const name = nameMatch?.[1]?.replace(/\\u0026/g, "&");

    if (name || followerCount != null) {
      return {
        platform_username: name ?? identifier,
        display_name: name ?? "Spotify",
        avatar_url: imageMatch?.[1]?.replace(/\\u0026/g, "&") ?? null,
        follower_count: Number.isFinite(followerCount ?? NaN) ? followerCount : null,
        count_label: kind === "artist" ? "Followers" : "Followers",
      };
    }
  }

  return emptyResult("Followers");
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
    case "roblox":
      return fetchRobloxStats(username);
    case "spotify":
      return fetchSpotifyStats(username, url);
    default:
      return emptyResult();
  }
}
