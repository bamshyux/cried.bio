const ACTIVITY_IMAGE_SIZE = 128;

function decodeMpExternalUrl(encoded: string): string | null {
  try {
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const binary =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
        : atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return binary.startsWith("http") ? binary : null;
  } catch {
    return null;
  }
}

/** Resolve Discord / Lanyard activity asset keys to a CDN URL. */
export function resolveActivityAssetUrl(
  asset?: string | null,
  applicationId?: string | null,
): string | null {
  if (!asset) return null;

  if (asset.startsWith("http://") || asset.startsWith("https://")) {
    return asset;
  }

  if (asset.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${asset.slice("spotify:".length)}`;
  }

  if (asset.startsWith("mp:external/")) {
    return decodeMpExternalUrl(asset.slice("mp:external/".length));
  }

  if (asset.startsWith("mp:")) {
    return `https://media.discordapp.net/${asset.slice("mp:".length)}`;
  }

  if (applicationId && /^\d+$/.test(applicationId)) {
    return `https://cdn.discordapp.com/app-assets/${applicationId}/${asset}.png?size=${ACTIVITY_IMAGE_SIZE}`;
  }

  return null;
}

export function pickActivityImageUrl(activity: {
  largeImageUrl?: string | null;
  smallImageUrl?: string | null;
}): string | null {
  return activity.largeImageUrl ?? activity.smallImageUrl ?? null;
}

export function getActivityTypeLabel(type?: number): string {
  switch (type) {
    case 0:
      return "Playing";
    case 1:
      return "Streaming";
    case 2:
      return "Listening to";
    case 3:
      return "Watching";
    case 4:
      return "Custom Status";
    case 5:
      return "Competing in";
    default:
      return "Playing";
  }
}
