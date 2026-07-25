import type { ProfilePresetData } from "@/lib/types/profile-preset";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/";

type StorageRef = {
  bucket: string;
  path: string;
};

type CopyStorageResult = {
  ok: boolean;
  missing?: boolean;
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

function isMissingObjectError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("does not exist") ||
    normalized.includes("object not found") ||
    normalized.includes("no such file")
  );
}

/** True when a cried.bio storage URL still points at a live profile slot instead of a preset copy. */
export function isMutableUserAssetUrl(ownerUserId: string, url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return false;
  if (!parsed.path.startsWith(`${ownerUserId}/`)) return false;
  return !parsed.path.includes("/presets/");
}

export function presetUsesMutableAssets(
  ownerUserId: string,
  scopeId: string,
  data: ProfilePresetData,
): boolean {
  for (const url of collectPresetAssetUrls(data)) {
    if (isMutableUserAssetUrl(ownerUserId, url)) return true;
  }
  return false;
}

export function collectPresetAssetUrls(data: ProfilePresetData): string[] {
  const urls: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) urls.push(value.trim());
  };

  push(data.profile.avatar_url);
  push(data.profile.banner_url);
  push(data.settings.background_image_url);
  push(data.settings.background_video_url);
  push(data.settings.enter_gate_background_image_url);
  push(data.settings.enter_gate_background_video_url);
  push(data.settings.music_url);
  push(data.settings.cursor_image_url);
  push(data.settings.profile_favicon_url);

  for (const link of data.links) push(link.icon);
  for (const block of data.featuredBlocks) push(block.thumbnail_url);

  return urls;
}

async function resolveStorageClient(userClient?: SupabaseClient): Promise<SupabaseClient> {
  const admin = createAdminClient();
  if (admin) return admin;
  if (userClient) return userClient;
  return createClient();
}

async function copyViaServiceRoleRest(
  bucket: string,
  sourcePath: string,
  destPath: string,
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!baseUrl || !serviceKey) return false;

  const response = await fetch(`${baseUrl}/storage/v1/object/copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: bucket,
      sourceKey: sourcePath,
      destinationKey: destPath,
    }),
  });

  return response.ok;
}

async function copyStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  sourcePath: string,
  destPath: string,
): Promise<CopyStorageResult> {
  await supabase.storage.from(bucket).remove([destPath]);

  const { error: copyError } = await supabase.storage.from(bucket).copy(sourcePath, destPath);
  if (!copyError) return { ok: true };

  if (isMissingObjectError(copyError.message)) {
    return { ok: false, missing: true };
  }

  if (await copyViaServiceRoleRest(bucket, sourcePath, destPath)) {
    return { ok: true };
  }

  const { data, error: downloadError } = await supabase.storage.from(bucket).download(sourcePath);

  let payload: Blob | ArrayBuffer;
  let contentType: string | undefined;

  if (!downloadError && data) {
    payload = data;
    contentType = data.type || undefined;
  } else {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(sourcePath);
    const response = await fetch(publicUrl, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) return { ok: false, missing: true };
      return { ok: false };
    }
    payload = await response.arrayBuffer();
    contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
  }

  const { error: uploadError } = await supabase.storage.from(bucket).upload(destPath, payload, {
    upsert: true,
    contentType,
  });

  if (uploadError) {
    if (isMissingObjectError(uploadError.message)) {
      return { ok: false, missing: true };
    }
    return { ok: false };
  }

  return { ok: true };
}

function publicUrlForPath(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${publicUrl}?v=${Date.now()}`;
}

async function freezeAssetUrl(
  supabase: SupabaseClient,
  ownerUserId: string,
  scopeId: string,
  url: string | null | undefined,
  fileBase: string,
): Promise<{ url: string | null; failed: boolean }> {
  if (typeof url !== "string") return { url: null, failed: false };
  const trimmed = url.trim();
  if (!trimmed) return { url: null, failed: false };

  const parsed = parseSupabaseStorageUrl(trimmed);
  if (!parsed) return { url: trimmed, failed: false };

  const { bucket, path: sourcePath } = parsed;
  if (isAlreadyScoped(ownerUserId, scopeId, sourcePath)) {
    return { url: publicUrlForPath(supabase, bucket, sourcePath), failed: false };
  }

  if (!isMutableUserAssetUrl(ownerUserId, trimmed)) {
    return { url: trimmed, failed: false };
  }

  const ext = extensionFromPath(sourcePath) || ".bin";
  const destPath = `${presetAssetPrefix(ownerUserId, scopeId)}${fileBase}${ext}`;
  const copied = await copyStorageObject(supabase, bucket, sourcePath, destPath);

  if (copied.missing) {
    return { url: null, failed: false };
  }

  if (!copied.ok) {
    return { url: trimmed, failed: true };
  }

  return { url: publicUrlForPath(supabase, bucket, destPath), failed: false };
}

export type FreezePresetAssetsResult = {
  data: ProfilePresetData;
  failedAssets: string[];
};

export type FreezePresetAssetsOptions = {
  supabase?: SupabaseClient;
};

/** Copy live profile media into preset-scoped storage so presets stay frozen. */
export async function freezePresetAssets(
  ownerUserId: string,
  scopeId: string,
  data: ProfilePresetData,
  options?: FreezePresetAssetsOptions,
): Promise<FreezePresetAssetsResult> {
  const supabase = await resolveStorageClient(options?.supabase);
  const failedAssets: string[] = [];
  const settings = { ...data.settings };

  const freezeSetting = async (key: string, value: unknown, fileBase: string) => {
    const result = await freezeAssetUrl(
      supabase,
      ownerUserId,
      scopeId,
      value as string | null,
      fileBase,
    );
    if (result.failed) failedAssets.push(key);
    return result.url;
  };

  settings.background_image_url = await freezeSetting(
    "background_image_url",
    settings.background_image_url,
    "background",
  );
  settings.background_video_url = await freezeSetting(
    "background_video_url",
    settings.background_video_url,
    "background-video",
  );
  settings.enter_gate_background_image_url = await freezeSetting(
    "enter_gate_background_image_url",
    settings.enter_gate_background_image_url,
    "enter-gate",
  );
  settings.enter_gate_background_video_url = await freezeSetting(
    "enter_gate_background_video_url",
    settings.enter_gate_background_video_url,
    "enter-gate-video",
  );
  settings.music_url = await freezeSetting("music_url", settings.music_url, "music");
  settings.cursor_image_url = await freezeSetting(
    "cursor_image_url",
    settings.cursor_image_url,
    "cursor",
  );
  settings.profile_favicon_url = await freezeSetting(
    "profile_favicon_url",
    settings.profile_favicon_url,
    "favicon",
  );

  const avatarResult = await freezeAssetUrl(
    supabase,
    ownerUserId,
    scopeId,
    data.profile.avatar_url,
    "avatar",
  );
  if (avatarResult.failed) failedAssets.push("avatar_url");
  const bannerResult = await freezeAssetUrl(
    supabase,
    ownerUserId,
    scopeId,
    data.profile.banner_url,
    "banner",
  );
  if (bannerResult.failed) failedAssets.push("banner_url");

  const links = await Promise.all(
    data.links.map(async (link, index) => {
      if (!isMutableUserAssetUrl(ownerUserId, link.icon)) return link;
      const result = await freezeAssetUrl(
        supabase,
        ownerUserId,
        scopeId,
        link.icon,
        `link-icon-${index}`,
      );
      if (result.failed) failedAssets.push(`links[${index}].icon`);
      return { ...link, icon: result.url ?? link.icon };
    }),
  );

  const featuredBlocks = await Promise.all(
    data.featuredBlocks.map(async (block, index) => {
      if (!isMutableUserAssetUrl(ownerUserId, block.thumbnail_url)) return block;
      const result = await freezeAssetUrl(
        supabase,
        ownerUserId,
        scopeId,
        block.thumbnail_url,
        `featured-${index}`,
      );
      if (result.failed) failedAssets.push(`featuredBlocks[${index}].thumbnail_url`);
      return { ...block, thumbnail_url: result.url };
    }),
  );

  return {
    data: {
      ...data,
      profile: {
        ...data.profile,
        avatar_url: avatarResult.url,
        banner_url: bannerResult.url,
      },
      settings,
      links,
      featuredBlocks,
    },
    failedAssets,
  };
}

export async function deletePresetAssetScope(ownerUserId: string, scopeId: string): Promise<void> {
  const supabase = await resolveStorageClient();
  const prefix = `${ownerUserId}/presets/${scopeId}`;

  for (const bucket of ["backgrounds", "music", "profiles"] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(prefix);
    if (!files?.length) continue;

    const paths = files
      .filter((file) => file.name && !file.id?.endsWith("/"))
      .map((file) => `${prefix}/${file.name}`);
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}
