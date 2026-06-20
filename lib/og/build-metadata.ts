import type { Metadata } from "next";
import { SITE_HOST } from "@/lib/site";
import { getSiteUrl } from "@/lib/site";
import type { OgProfileSnapshot } from "@/lib/og/types";

export function buildProfileOgMetadata(
  snapshot: OgProfileSnapshot,
  options?: { preview?: boolean },
): Metadata {
  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/${snapshot.username}`;
  const ogImageUrl = `${siteUrl}/api/og/${snapshot.username}`;
  const title = `${snapshot.displayName} — cried.bio`;
  const description = snapshot.bio;

  return {
    title: options?.preview ? `Preview — ${title}` : title,
    description,
    robots: options?.preview ? { index: false, follow: false } : undefined,
    alternates: { canonical: profileUrl },
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
      images: [ogImageUrl],
    },
  };
}
