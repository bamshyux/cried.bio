import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { embedOgImages } from "@/lib/og/embed-images";
import { getOgFonts } from "@/lib/og/fonts";
import { DefaultOgCard, OgProfileCard } from "@/lib/og/profile-card";
import { getOgProfileSnapshot } from "@/lib/og/profile-data";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export const revalidate = 300;
export const maxDuration = 60;

const OG_SIZE = { width: 1200, height: 630 } as const;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  "Content-Type": "image/png",
};

async function renderOgImage(element: ReactElement) {
  let fonts: Awaited<ReturnType<typeof getOgFonts>> | undefined;
  try {
    fonts = await getOgFonts();
  } catch (error) {
    console.error("[og] font load failed, using default font", error);
  }

  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts,
    headers: CACHE_HEADERS,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;
    const snapshot = await getOgProfileSnapshot(username);

    if (!snapshot) {
      return await renderOgImage(<DefaultOgCard />);
    }

    const profile = await embedOgImages(snapshot);
    return await renderOgImage(<OgProfileCard profile={profile} />);
  } catch (error) {
    console.error("[og] render failed", error);
    return new ImageResponse(<DefaultOgCard />, {
      ...OG_SIZE,
      headers: CACHE_HEADERS,
    });
  }
}
