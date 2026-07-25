import type { ProfilePresetData } from "@/lib/types/profile-preset";
import { createClient } from "@/lib/supabase/server";

const STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/";

type StorageRef = {
  bucket: string;
  path: string;
};

export function parseSupabaseStorageUrl(url: string): StorageRef | null {
  try {
    const pathname = new URL(url.split("?")[0]).pathname;
    const index = pathname.indexOf(STORAGE_PUBLIC_MARKER);
    if (index === -1) return null;
    const remainder = pathname.slice(index + STORAGE_PUBLIC_MARKER.length);
    const slash = remainder.indexOf("/");
    if (slash <= 0) return null;
    return {
      bucket: remainder.slice(0, slash),
      path: decodeURIComponent(remainder.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

function extensionFromPath(path: string): string {
  const filename = path.split("/").pop() ?? "";
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : "";
}

function presetAssetPrefix(ownerUserId: string, scopeId: string): string {
  return `${ownerUserId}/presets/${scopeId}/`;
}

function isAlreadyScoped(ownerUserId: string, scopeId: string, sourcePath: string): boolean {
  return sourcePath.startsWith(presetAssetPrefix(ownerUserId, scopeId));
}

async function copyStorageObject(
  bucket: string,
  sourcePath: string,
  destPath: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).download(sourcePath);

  let payload: Blob | ArrayBuffer;
  let contentType: string | undefined;

  if (!error && data) {
    payload = data;
    contentType = data.type || undefined;
  } else {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(sourcePath);
    const response = await fetch(publicUrl, { cache: "no-store" });
    if (!response.ok) return false;
    payload = await response.arrayBuffer();
    contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
  }

  const { error: uploadError } = await supabase.storage.from(bucket).upload(destPath, payload, {
    upsert: true,
    contentType,
  });

  return !uploadError;
}

async function freezeAssetUrl(
  ownerUserId: string,
  scopeId: string,
  url: string | null | undefined,
  fileBase: string,
): Promise<string | null> {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const parsed = parseSupabaseStorageUrl(trimmed);
  if (!parsed) return trimmed;

  const { bucket, path: sourcePath } = parsed;
  if (isAlreadyScoped(ownerUserId, scopeId, sourcePath)) {
    const {
      data: { publicUrl },
    } = (await createClient()).storage.from(bucket).getPublicUrl(sourcePath);
    return `${publicUrl}?v=${Date.now()}`;
  }

  const ext = extensionFromPath(sourcePath) || ".bin";
  const destPath = `${presetAssetPrefix(ownerUserId, scopeId)}${fileBase}${ext}`;
  const copied = await copyStorageObject(bucket, sourcePath, destPath);
  if (!copied) return trimmed;

  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(destPath);
  return `${publicUrl}?v=${Date.now()}`;
}

/** Copy live profile media into preset-scoped storage so presets stay frozen. */
export async function freezePresetAssets(
  ownerUserId: string,
  scopeId: string,
  data: ProfilePresetData,
): Promise<ProfilePresetData> {
  const settings = { ...data.settings };

  const [
    avatar_url,
    banner_url,
    background_image_url,
    background_video_url,
    enter_gate_background_image_url,
    enter_gate_background_video_url,
    music_url,
    cursor_image_url,
    profile_favicon_url,
  ] = await Promise.all([
    freezeAssetUrl(ownerUserId, scopeId, data.profile.avatar_url, "avatar"),
    freezeAssetUrl(ownerUserId, scopeId, data.profile.banner_url, "banner"),
    freezeAssetUrl(ownerUserId, scopeId, settings.background_image_url as string | null, "background"),
    freezeAssetUrl(ownerUserId, scopeId, settings.background_video_url as string | null, "background-video"),
    freezeAssetUrl(
      ownerUserId,
      scopeId,
      settings.enter_gate_background_image_url as string | null,
      "enter-gate",
    ),
    freezeAssetUrl(
      ownerUserId,
      scopeId,
      settings.enter_gate_background_video_url as string | null,
      "enter-gate-video",
    ),
    freezeAssetUrl(ownerUserId, scopeId, settings.music_url as string | null, "music"),
    freezeAssetUrl(ownerUserId, scopeId, settings.cursor_image_url as string | null, "cursor"),
    freezeAssetUrl(ownerUserId, scopeId, settings.profile_favicon_url as string | null, "favicon"),
  ]);

  settings.background_image_url = background_image_url;
  settings.background_video_url = background_video_url;
  settings.enter_gate_background_image_url = enter_gate_background_image_url;
  settings.enter_gate_background_video_url = enter_gate_background_video_url;
  settings.music_url = music_url;
  settings.cursor_image_url = cursor_image_url;
  settings.profile_favicon_url = profile_favicon_url;

  const links = await Promise.all(
    data.links.map(async (link, index) => ({
      ...link,
      icon: (await freezeAssetUrl(ownerUserId, scopeId, link.icon, `link-icon-${index}`)) ?? link.icon,
    })),
  );

  const featuredBlocks = await Promise.all(
    data.featuredBlocks.map(async (block, index) => ({
      ...block,
      thumbnail_url: await freezeAssetUrl(
        ownerUserId,
        scopeId,
        block.thumbnail_url,
        `featured-${index}`,
      ),
    })),
  );

  return {
    ...data,
    profile: {
      ...data.profile,
      avatar_url,
      banner_url,
    },
    settings,
    links,
    featuredBlocks,
  };
}

export async function deletePresetAssetScope(ownerUserId: string, scopeId: string): Promise<void> {
  const supabase = await createClient();
  const prefix = `${ownerUserId}/presets/${scopeId}`;

  for (const bucket of ["backgrounds", "music", "profiles"] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(prefix);
    if (!files?.length) continue;

    const paths = files.map((file) => `${prefix}/${file.name}`);
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}
