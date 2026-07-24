import type { OgProfileSnapshot } from "@/lib/og/types";
import { extractOgVideoBackgroundFrame } from "@/lib/og/extract-video-frame";

const IMAGE_FETCH_TIMEOUT_MS = 8_000;

const DEFAULT_GRADIENT = ["#090909", "#141414", "#1a1a1a"] as const;

async function fetchAsDataUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(trimmed, {
      signal: controller.signal,
      headers: { "User-Agent": "cried.bio-og/1.0" },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) return null;

    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${contentType.split(";")[0]};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Inline remote images so Satori does not fail when fetching during render. */
export async function embedOgImages(
  snapshot: OgProfileSnapshot,
): Promise<OgProfileSnapshot> {
  const avatarPromise = snapshot.avatarUrl
    ? fetchAsDataUrl(snapshot.avatarUrl)
    : Promise.resolve(null);

  const backgroundPromise = (async () => {
    if (snapshot.background.kind === "image") {
      return fetchAsDataUrl(snapshot.background.url);
    }

    if (snapshot.background.kind === "video") {
      const frame = await extractOgVideoBackgroundFrame(snapshot.background.url);
      if (!frame) return null;
      return `data:image/jpeg;base64,${frame.toString("base64")}`;
    }

    return null;
  })();

  const [avatarUrl, backgroundUrl] = await Promise.all([
    avatarPromise,
    backgroundPromise,
  ]);

  return {
    ...snapshot,
    avatarUrl: avatarUrl ?? snapshot.avatarUrl,
    background:
      (snapshot.background.kind === "image" || snapshot.background.kind === "video") &&
      backgroundUrl
        ? { kind: "image", url: backgroundUrl }
        : snapshot.background.kind === "image" || snapshot.background.kind === "video"
          ? { kind: "gradient", colors: [...DEFAULT_GRADIENT] }
          : snapshot.background,
  };
}
