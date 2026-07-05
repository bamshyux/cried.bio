import { getSiteUrl } from "@/lib/site";

const ICON_LINK_SELECTOR =
  "link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']";

export function faviconMimeFromStoredUrl(storedUrl: string | null): string {
  if (!storedUrl) return "image/png";

  try {
    const pathname = new URL(storedUrl).pathname.toLowerCase();
    if (pathname.endsWith(".ico")) return "image/x-icon";
    if (pathname.endsWith(".png")) return "image/png";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
    if (pathname.endsWith(".webp")) return "image/webp";
    if (pathname.endsWith(".gif")) return "image/gif";
  } catch {
    /* ignore */
  }

  return "image/png";
}

export function stripFaviconCacheParam(storedUrl: string): string {
  try {
    const url = new URL(storedUrl);
    url.search = "";
    return url.toString();
  } catch {
    return storedUrl.split("?")[0] ?? storedUrl;
  }
}

export function faviconVersionFromStoredUrl(storedUrl: string | null): string {
  if (!storedUrl) return "1";

  try {
    return new URL(storedUrl).searchParams.get("v") ?? "1";
  } catch {
    return "1";
  }
}

export function buildProfileFaviconPath(
  username: string,
  storedUrl: string | null,
): string | null {
  if (!storedUrl?.trim()) return null;

  const version = faviconVersionFromStoredUrl(storedUrl);
  return `/api/favicon/${encodeURIComponent(username)}?v=${encodeURIComponent(version)}`;
}

export function buildProfileFaviconHref(
  username: string,
  storedUrl: string | null,
): string | null {
  const path = buildProfileFaviconPath(username, storedUrl);
  if (!path) return null;
  return `${getSiteUrl()}${path}`;
}

export function isValidProfileFaviconStorageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.includes("/favicon.");
  } catch {
    return false;
  }
}

export function applyProfileFavicon(href: string, type: string): () => void {
  if (typeof document === "undefined") return () => {};

  const removed: HTMLLinkElement[] = [];

  document.querySelectorAll<HTMLLinkElement>(ICON_LINK_SELECTOR).forEach((link) => {
    if (link.dataset.profileBranding === "true") return;
    removed.push(link);
    link.remove();
  });

  document
    .querySelectorAll<HTMLLinkElement>("link[data-profile-branding='true']")
    .forEach((link) => link.remove());

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = href;
  icon.type = type;
  icon.sizes = "32x32";
  icon.dataset.profileBranding = "true";
  document.head.prepend(icon);

  return () => {
    document
      .querySelectorAll<HTMLLinkElement>("link[data-profile-branding='true']")
      .forEach((link) => link.remove());
    removed.forEach((link) => document.head.appendChild(link));
  };
}
