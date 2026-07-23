export const SITE_HOST = "cried.bio";
export const SITE_URL = `https://${SITE_HOST}`;

export const DISCORD_COMMUNITY_INVITE_URL = "https://discord.gg/UKhDRUfR5v";

/** Legacy domains that must not be used for redirects or billing return URLs */
const LEGACY_SITE_HOSTS = new Set(["bioforge.blog", "www.bioforge.blog"]);

function normalizeSiteUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isLegacySiteUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return LEGACY_SITE_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const normalized = normalizeSiteUrl(fromEnv);
    if (!isLegacySiteUrl(normalized)) {
      return normalized;
    }
  }

  return process.env.NODE_ENV === "production" ? SITE_URL : "http://localhost:3000";
}
