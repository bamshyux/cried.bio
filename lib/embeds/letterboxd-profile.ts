import type { ParsedEmbed } from "@/lib/types/embed";

const LETTERBOXD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const RESERVED_USERNAMES = new Set([
  "film",
  "actor",
  "director",
  "directors",
  "list",
  "lists",
  "member",
  "members",
  "journal",
  "pro",
  "settings",
  "sign-in",
  "create-account",
  "about",
  "welcome",
  "api",
  "apps",
  "advertise",
  "terms",
  "privacy",
  "contact",
  "gift-guide",
  "browse",
  "tags",
  "films",
  "crew",
  "watchlist",
  "likes",
  "reviews",
  "activity",
  "network",
  "diary",
  "ratings",
  "following",
  "followers",
  "search",
  "rss",
  "s",
  "trending",
  "popular",
  "new",
  "updated",
  "year-in-review",
  "seasonal",
  "story",
  "premium",
  "patron",
  "invite",
  "oauth",
  "user",
  "cdn-cgi",
]);

export type LetterboxdProfileData = {
  username: string;
  displayName: string;
  avatarUrl: string;
  statsLine: string;
  bio: string;
};

export function normalizeLetterboxdUsername(value: string): string | null {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{2,15}$/.test(username)) return null;
  if (RESERVED_USERNAMES.has(username)) return null;
  return username;
}

export function buildLetterboxdProfileUrl(username: string): string {
  const normalized = normalizeLetterboxdUsername(username) ?? username.trim().toLowerCase();
  return `https://letterboxd.com/${normalized}/`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseMetaContent(html: string, key: "property" | "name", name: string): string {
  const patterns = [
    new RegExp(`<meta\\s+${key}="${name}"\\s+content="([^"]*)"`, "i"),
    new RegExp(`<meta\\s+content="([^"]*)"\\s+${key}="${name}"`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }

  return "";
}

function parseDisplayNameFromOgTitle(title: string): string {
  return title.replace(/['’]s profile$/i, "").trim();
}

function parseStatsLine(html: string, description: string): string {
  const films = html.match(
    /<span class="value">(\d+)<\/span>\s*<span class="definition[^"]*">\s*Films\s*<\/span>/i,
  )?.[1];
  const following = html.match(
    /<span class="value">(\d+)<\/span>\s*<span class="definition[^"]*">\s*Following\s*<\/span>/i,
  )?.[1];
  const followers = html.match(
    /<span class="value">(\d+)<\/span>\s*<span class="definition[^"]*">\s*Followers\s*<\/span>/i,
  )?.[1];

  const parts: string[] = [];
  if (films) parts.push(`${films} films`);
  if (followers) parts.push(`${followers} followers`);
  if (following) parts.push(`${following} following`);
  if (parts.length > 0) return parts.join(" · ");

  const filmsFromDescription = description.match(/(\d[\d,]*)\s+films?\s+watched/i)?.[1];
  if (filmsFromDescription) return `${filmsFromDescription.replace(/,/g, "")} films watched`;

  return "";
}

function parseBio(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  const firstSentence = trimmed.split(/\.\s+/)[0]?.trim() ?? trimmed;
  return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
}

async function fetchLetterboxdRss(username: string): Promise<Partial<LetterboxdProfileData>> {
  const res = await fetch(`https://letterboxd.com/${username}/rss/`, {
    headers: { "User-Agent": LETTERBOXD_USER_AGENT, Accept: "application/rss+xml" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return {};

  const xml = await res.text();
  const titleMatch = xml.match(/<title>\s*Letterboxd\s*-\s*([^<]+)\s*<\/title>/i);
  const displayName = titleMatch?.[1]?.trim() ?? "";

  return {
    username,
    displayName,
  };
}

export async function fetchLetterboxdProfile(username: string): Promise<LetterboxdProfileData | null> {
  const normalized = normalizeLetterboxdUsername(username);
  if (!normalized) return null;

  let displayName = "";
  let avatarUrl = "";
  let statsLine = "";
  let bio = "";

  try {
    const res = await fetch(buildLetterboxdProfileUrl(normalized), {
      headers: {
        "User-Agent": LETTERBOXD_USER_AGENT,
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitle = parseMetaContent(html, "property", "og:title");
      const ogDescription = parseMetaContent(html, "property", "og:description");
      const ogImage = parseMetaContent(html, "property", "og:image");

      displayName = parseDisplayNameFromOgTitle(ogTitle);
      avatarUrl = ogImage;
      statsLine = parseStatsLine(html, ogDescription);
      bio = parseBio(ogDescription);
    }
  } catch {
    // Fall back to RSS below.
  }

  if (!displayName) {
    const rss = await fetchLetterboxdRss(normalized);
    displayName = rss.displayName ?? normalized;
  }

  if (!displayName) return null;

  return {
    username: normalized,
    displayName,
    avatarUrl,
    statsLine,
    bio,
  };
}

export async function enrichLetterboxdProfileEmbed(parsed: ParsedEmbed): Promise<ParsedEmbed> {
  if (parsed.embed_type !== "letterboxd") return parsed;

  const username = normalizeLetterboxdUsername(parsed.embed_id);
  if (!username) return parsed;

  const profile = await fetchLetterboxdProfile(username);
  const displayName = profile?.displayName ?? username;

  return {
    ...parsed,
    embed_id: username,
    title: `Letterboxd · ${displayName}`,
    url: buildLetterboxdProfileUrl(username),
  };
}

export function isLetterboxdLinkEmbed(type: string): type is "letterboxd" {
  return type === "letterboxd";
}

export function letterboxdEmbedLinkLabel(): string {
  return "View profile on Letterboxd →";
}
