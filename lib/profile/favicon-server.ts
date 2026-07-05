import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import {
  faviconMimeFromStoredUrl,
  stripFaviconCacheParam,
} from "@/lib/profile/favicon";

export type ProfileFaviconContent = {
  body: ArrayBuffer;
  contentType: string;
  cacheVersion: string;
};

export function parseProfileFaviconStoragePath(storedUrl: string): string | null {
  try {
    const pathname = new URL(storedUrl).pathname;
    const marker = "/storage/v1/object/public/profiles/";
    const index = pathname.indexOf(marker);
    if (index === -1) return null;
    const path = pathname.slice(index + marker.length);
    return path.includes("/favicon.") ? path : null;
  } catch {
    return null;
  }
}

async function downloadFromStorage(path: string) {
  const supabase = await createClient();
  return supabase.storage.from("profiles").download(path);
}

async function fetchFromPublicUrl(storedUrl: string) {
  const response = await fetch(stripFaviconCacheParam(storedUrl), { cache: "no-store" });
  if (!response.ok) return null;

  return {
    body: await response.arrayBuffer(),
    contentType:
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      faviconMimeFromStoredUrl(storedUrl),
  };
}

export async function getProfileFaviconContent(
  rawUsername: string,
): Promise<ProfileFaviconContent | null> {
  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) return null;

  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const settings = await getSettingsByProfileId(profile.id);
  const storedUrl = settings.profile_favicon_url?.trim();
  if (!storedUrl) return null;

  const cacheVersion = (() => {
    try {
      return new URL(storedUrl).searchParams.get("v") ?? "1";
    } catch {
      return "1";
    }
  })();
  const storagePath = parseProfileFaviconStoragePath(storedUrl);

  if (storagePath) {
    const { data, error } = await downloadFromStorage(storagePath);
    if (!error && data) {
      return {
        body: await data.arrayBuffer(),
        contentType: data.type || faviconMimeFromStoredUrl(storedUrl),
        cacheVersion,
      };
    }
  }

  const fetched = await fetchFromPublicUrl(storedUrl);
  if (!fetched) return null;

  return {
    body: fetched.body,
    contentType: fetched.contentType,
    cacheVersion,
  };
}
