/** Strip cache-busting query params when comparing audio sources. */
export function normalizeAudioUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function isPlayableAudioUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    if (/youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tiktok\.com/i.test(parsed.hostname)) {
      return false;
    }

    if (parsed.pathname.includes("/storage/v1/object/public/music/")) return true;

    return /\.(mp3|wav|ogg|webm|m4a|aac|mpeg|mp4)(\?|$)/i.test(parsed.pathname);
  } catch {
    return /\.(mp3|wav|ogg|webm|m4a|aac)(\?|$)/i.test(trimmed);
  }
}
