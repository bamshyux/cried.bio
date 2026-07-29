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
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/json",
        ...(init?.headers ?? {}),
      },
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
      cache: "no-store",
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

function parseCompactCountText(value: string | null | undefined): number | null {
  if (!value) return null;

  const compactMatch = value.trim().match(/([\d,.]+)\s*([KMBkmb])?/);
  if (compactMatch) {
    let num = Number.parseFloat(compactMatch[1].replace(/,/g, ""));
    if (Number.isFinite(num)) {
      const suffix = (compactMatch[2] ?? "").toUpperCase();
      if (suffix === "K") num *= 1_000;
      else if (suffix === "M") num *= 1_000_000;
      else if (suffix === "B") num *= 1_000_000_000;
      return Math.round(num);
    }
  }

  return parseCount(value.replace(/[^\d,]/g, ""));
}

function isYouTubeChannelId(value: string): boolean {
  return /^UC[\w-]{20,}$/i.test(value);
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

function buildYouTubeScrapeUrls(handle: string, url?: string): string[] {
  const normalizedHandle = handle.replace(/^@/, "");
  const candidates: string[] = [];

  if (isYouTubeChannelId(handle)) {
    candidates.push(`https://www.youtube.com/channel/${encodeURIComponent(handle)}/about`);
  } else if (normalizedHandle) {
    candidates.push(`https://www.youtube.com/@${encodeURIComponent(normalizedHandle)}/about`);
    candidates.push(`https://m.youtube.com/@${encodeURIComponent(normalizedHandle)}/about`);
    candidates.push(`https://www.youtube.com/c/${encodeURIComponent(normalizedHandle)}/about`);
    candidates.push(`https://www.youtube.com/user/${encodeURIComponent(normalizedHandle)}/about`);
  }

  if (url) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/\/$/, "");
      if (path) {
        candidates.push(`https://www.youtube.com${path}/about`);
        if (!path.endsWith("/about")) candidates.push(`https://www.youtube.com${path}`);
      }
    } catch {
      // ignore malformed URLs
    }
  }

  return [...new Set(candidates)];
}

function parseYouTubeSubscriberCount(html: string): number | null {
  const patterns = [
    /"subscriberCountText":"([^"]+)"/,
    /"subscriberCountText":\{"simpleText":"([^"]+)"/,
    /"subscriberCountText":\{"runs":\[\{"text":"([^"]+)"/,
    /"subscriberCountText":\{"accessibility":\{[^}]*\}[^}]*"simpleText":"([^"]+)"/,
    /"subscriberCount":"(\d+)"/,
    /"subscriberCount":(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const raw = match?.[1];
    if (!raw) continue;

    if (/^\d+$/.test(raw)) return Number.parseInt(raw, 10);
    const compact = parseCompactCountText(raw);
    if (compact != null) return compact;
  }

  return null;
}

function parseYouTubeChannelMeta(html: string, fallbackHandle: string) {
  const handleMatch =
    html.match(/"canonicalBaseUrl":"\\\/@([^"\\]+)/) ??
    html.match(/"vanityChannelUrl":"https:\\\/\\\/www\.youtube\.com\\\/@([^"\\]+)/);
  const avatarMatch = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/);
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);

  return {
    platform_username: handleMatch?.[1] ?? fallbackHandle.replace(/^@/, ""),
    display_name: ogTitleMatch?.[1] ?? handleMatch?.[1] ?? fallbackHandle,
    avatar_url: avatarMatch?.[1] ?? null,
  };
}

async function scrapeYouTubeStats(handle: string, url?: string): Promise<PlatformStatFetchResult | null> {
  const normalizedHandle = handle.replace(/^@/, "");
  const scrapeUrls = buildYouTubeScrapeUrls(handle, url);
  let html: string | null = null;
  let followerCount: number | null = null;

  for (const pageUrl of scrapeUrls) {
    const pageHtml = await fetchText(pageUrl, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!pageHtml) continue;

    const count = parseYouTubeSubscriberCount(pageHtml);
    if (count != null) {
      html = pageHtml;
      followerCount = count;
      break;
    }
  }

  if (!html || followerCount == null) return null;

  const meta = parseYouTubeChannelMeta(html, normalizedHandle || handle);

  return {
    platform_username: meta.platform_username,
    display_name: meta.display_name,
    avatar_url: meta.avatar_url,
    follower_count: followerCount,
    count_label: "Subscribers",
  };
}

async function fetchYouTubeStats(handle: string, url?: string): Promise<PlatformStatFetchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    const apiUrl = isYouTubeChannelId(handle)
      ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`
      : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle.startsWith("@") ? handle : `@${handle}`)}&key=${encodeURIComponent(apiKey)}`;

    const data = await fetchJson<{
      items?: Array<{
        snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } };
        statistics?: { subscriberCount?: string };
      }>;
    }>(apiUrl);

    const channel = data?.items?.[0];
    if (channel) {
      const subscribers = channel.statistics?.subscriberCount
        ? Number.parseInt(channel.statistics.subscriberCount, 10)
        : null;

      if (Number.isFinite(subscribers ?? NaN)) {
        return {
          platform_username: channel.snippet?.customUrl?.replace(/^@/, "") ?? handle.replace(/^@/, ""),
          display_name: channel.snippet?.title ?? handle,
          avatar_url: channel.snippet?.thumbnails?.default?.url ?? null,
          follower_count: subscribers,
          count_label: "Subscribers",
        };
      }
    }
  }

  const scraped = await scrapeYouTubeStats(handle, url);
  return scraped ?? emptyResult("Subscribers");
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
  const apiData = await fetchJson<{
    data?: {
      user?: {
        username?: string;
        full_name?: string;
        profile_pic_url_hd?: string;
        profile_pic_url?: string;
        edge_followed_by?: { count?: number };
        follower_count?: number;
      };
    };
  }>(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
    headers: {
      "X-IG-App-ID": "936619743392459",
      Referer: "https://www.instagram.com/",
    },
  });

  const user = apiData?.data?.user;
  if (user?.username) {
    const followerCount = user.edge_followed_by?.count ?? user.follower_count ?? null;
    return {
      platform_username: user.username,
      display_name: user.full_name || user.username,
      avatar_url: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
      follower_count: typeof followerCount === "number" ? followerCount : null,
      count_label: "Followers",
    };
  }

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

async function fetchTwitterViaFxTwitter(username: string): Promise<PlatformStatFetchResult | null> {
  const data = await fetchJson<{
    code?: number;
    user?: {
      screen_name?: string;
      name?: string;
      avatar_url?: string;
      followers?: number;
    };
  }>(`https://api.fxtwitter.com/2/profile/${encodeURIComponent(username)}`);

  const user = data?.user;
  if (!user?.screen_name || typeof user.followers !== "number") return null;

  return {
    platform_username: user.screen_name,
    display_name: user.name ?? user.screen_name,
    avatar_url: user.avatar_url ?? null,
    follower_count: user.followers,
    count_label: "Followers",
  };
}

async function fetchTwitterStats(username: string): Promise<PlatformStatFetchResult> {
  const fxTwitter = await fetchTwitterViaFxTwitter(username);
  if (fxTwitter) return fxTwitter;

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

async function getSpotifyEmbedToken(artistId: string): Promise<string | null> {
  const html = await fetchText(`https://open.spotify.com/embed/artist/${encodeURIComponent(artistId)}`);
  if (!html) return null;

  const tokenMatch =
    html.match(/"accessToken":"([^"]+)"/) ?? html.match(/accessToken\\":\\"([^\\"]+)/);
  return tokenMatch?.[1] ?? null;
}

const SPOTIFY_ARTIST_OVERVIEW_HASHES = [
  "79a4a9d7c3a3781d801e62b62ef11c7ee56fce2626772eb26cd20c69f84b3f49",
  "d66221ea13998b2f81883c5187d174c8646e4041d67f5b1e103bc262d447e3a0",
];

async function fetchSpotifyArtistViaPathfinder(
  artistId: string,
): Promise<PlatformStatFetchResult | null> {
  const token = await getSpotifyEmbedToken(artistId);
  if (!token) return null;

  const spotifyHeaders = {
    Authorization: `Bearer ${token}`,
    "app-platform": "WebPlayer",
    origin: "https://open.spotify.com",
    referer: "https://open.spotify.com/",
  };

  for (const sha256Hash of SPOTIFY_ARTIST_OVERVIEW_HASHES) {
    const variables = JSON.stringify({
      uri: `spotify:artist:${artistId}`,
      locale: "",
      includePrerelease: true,
    });
    const extensions = JSON.stringify({
      persistedQuery: { version: 1, sha256Hash },
    });

    type SpotifyArtistPayload = {
      profile?: { name?: string };
      stats?: { followers?: number };
      visuals?: { avatarImage?: { sources?: Array<{ url?: string }> } };
    };

    const data = await fetchJson<{
      data?: {
        artistUnion?: SpotifyArtistPayload;
        artist?: SpotifyArtistPayload;
      };
    }>(
      `https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=${encodeURIComponent(variables)}&extensions=${encodeURIComponent(extensions)}`,
      { headers: spotifyHeaders },
    );

    const artist = data?.data?.artistUnion ?? data?.data?.artist;
    const name = artist?.profile?.name;
    const followers = artist?.stats?.followers;
    if (!name || typeof followers !== "number") continue;

    return {
      platform_username: name,
      display_name: name,
      avatar_url: artist.visuals?.avatarImage?.sources?.[0]?.url ?? null,
      follower_count: followers,
      count_label: "Followers",
    };
  }

  return null;
}

async function fetchSpotifyOEmbed(url: string): Promise<PlatformStatFetchResult | null> {
  const data = await fetchJson<{
    title?: string;
    thumbnail_url?: string;
  }>(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);

  if (!data?.title) return null;

  return {
    platform_username: data.title,
    display_name: data.title,
    avatar_url: data.thumbnail_url ?? null,
    follower_count: null,
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

  if (kind === "artist") {
    const pathfinder = await fetchSpotifyArtistViaPathfinder(identifier);
    if (pathfinder?.follower_count != null) return pathfinder;

    const token = await getSpotifyAccessToken();
    if (token) {
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
          follower_count:
            typeof data.followers?.total === "number" ? data.followers.total : pathfinder?.follower_count ?? null,
          count_label: "Followers",
        };
      }
    }

    if (pathfinder) return pathfinder;
  }

  const oembed = await fetchSpotifyOEmbed(url);
  if (oembed) return oembed;

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
        count_label: "Followers",
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
      return fetchYouTubeStats(username, url);
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
