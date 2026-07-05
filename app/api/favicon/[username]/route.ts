import { getProfileByUsername } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import {
  faviconMimeFromStoredUrl,
  stripFaviconCacheParam,
} from "@/lib/profile/favicon";
import { SITE_URL } from "@/lib/site";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);

  if (!isValidUsername(username)) {
    return Response.redirect(new URL("/icon.svg", SITE_URL), 302);
  }

  const profile = await getProfileByUsername(username);
  if (!profile) {
    return Response.redirect(new URL("/icon.svg", SITE_URL), 302);
  }

  const settings = await getSettingsByProfileId(profile.id);
  const storedUrl = settings.profile_favicon_url?.trim();

  if (!storedUrl) {
    return Response.redirect(new URL("/icon.svg", SITE_URL), 302);
  }

  const sourceUrl = stripFaviconCacheParam(storedUrl);
  const upstream = await fetch(sourceUrl, { cache: "no-store" });

  if (!upstream.ok) {
    return Response.redirect(new URL("/icon.svg", SITE_URL), 302);
  }

  const body = await upstream.arrayBuffer();
  const contentType =
    upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
    faviconMimeFromStoredUrl(storedUrl);

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
