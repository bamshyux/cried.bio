import { SITE_HOST, SITE_URL } from "@/lib/site";

export function buildPublicProfileUrl(username: string, baseUrl: string = SITE_URL): string {
  const base = baseUrl.replace(/\/+$/, "");
  const slug = username.trim().replace(/^\/+/, "");
  return `${base}/${slug}`;
}

export function formatPublicProfileDisplay(username: string): string {
  return `${SITE_HOST}/${username.trim().replace(/^\/+/, "")}`;
}
