import type { Metadata } from "next";
import {
  buildProfileFaviconPath,
  faviconMimeFromStoredUrl,
} from "@/lib/profile/favicon";
import { SITE_HOST, SITE_URL } from "@/lib/site";
import type { OgProfileSnapshot } from "@/lib/og/types";

export function buildProfileOgMetadata(
  snapshot: OgProfileSnapshot,
  options?: { preview?: boolean },
): Metadata {
  const profileUrl = `${SITE_URL}/${snapshot.username}`;
  const ogImageUrl = `${SITE_URL}/api/og/${encodeURIComponent(snapshot.username)}`;
  const title = `${snapshot.displayName} — cried.bio`;
  const description = snapshot.bio;
  const faviconPath = buildProfileFaviconPath(snapshot.username, snapshot.faviconUrl);
  const faviconMime = faviconMimeFromStoredUrl(snapshot.faviconUrl);

  return {
    metadataBase: new URL(SITE_URL),
    title: options?.preview ? `Preview — ${title}` : title,
    description,
    robots: options?.preview ? { index: false, follow: false } : undefined,
    alternates: { canonical: profileUrl },
    ...(faviconPath
      ? {
          icons: {
            icon: [{ url: faviconPath, type: faviconMime, sizes: "32x32" }],
            shortcut: [{ url: faviconPath, type: faviconMime }],
            apple: [{ url: faviconPath }],
          },
        }
      : {}),
    openGraph: {
      type: "profile",
      url: profileUrl,
      siteName: "cried.bio",
      title: snapshot.displayName,
      description,
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${snapshot.displayName} on ${SITE_HOST}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: snapshot.displayName,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${snapshot.displayName} on ${SITE_HOST}` }],
    },
  };
}
