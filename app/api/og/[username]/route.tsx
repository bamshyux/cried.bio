import { ImageResponse } from "next/og";
import { DefaultOgCard, OgProfileCard } from "@/lib/og/profile-card";
import { getOgProfileSnapshot } from "@/lib/og/profile-data";
import { getOgFonts } from "@/lib/og/fonts";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export const revalidate = 300;

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const snapshot = await getOgProfileSnapshot(username);

  let element;
  if (snapshot) {
    element = <OgProfileCard profile={snapshot} />;
  } else {
    element = <DefaultOgCard />;
  }

  const fonts = await getOgFonts();

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts,
  });
}
