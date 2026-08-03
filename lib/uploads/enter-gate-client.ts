"use client";

import { ensureStorageUploadLimitsAction } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/client";
import {
  backgroundStorageExtension,
  backgroundUploadContentType,
  resolveBackgroundUploadKind,
} from "@/lib/uploads/background-media";
import { backgroundUploadSizeError } from "@/lib/uploads/limits";
import { isStorageSizeError, mapStorageUploadError } from "@/lib/uploads/storage-upload-error";

const SIGNED_UPLOAD_THRESHOLD = 6 * 1024 * 1024;

async function removeExistingEnterGateFiles(userId: string) {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from("backgrounds").list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name.startsWith("enter-gate."))
    .map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await supabase.storage.from("backgrounds").remove(paths);
  }
}

async function uploadViaSignedUrl(
  supabase: ReturnType<typeof createClient>,
  path: string,
  file: File,
  contentType: string,
) {
  const { data, error: signError } = await supabase.storage
    .from("backgrounds")
    .createSignedUploadUrl(path, { upsert: true });

  if (signError) throw new Error(signError.message);

  const { error: uploadError } = await supabase.storage
    .from("backgrounds")
    .uploadToSignedUrl(path, data.token, file, { contentType });

  if (uploadError) throw new Error(uploadError.message);
}

async function uploadDirect(
  supabase: ReturnType<typeof createClient>,
  path: string,
  file: File,
  contentType: string,
) {
  const { error } = await supabase.storage
    .from("backgrounds")
    .upload(path, file, { upsert: true, contentType });

  if (error) throw new Error(error.message);
}

async function performEnterGateUpload(
  file: File,
): Promise<{ url: string; isVideo: boolean }> {
  const kind = resolveBackgroundUploadKind(file);
  if (!kind) {
    throw new Error("Upload a JPEG, PNG, WebP, GIF, or MP4 file.");
  }

  const isVideo = kind === "video";
  const contentType = backgroundUploadContentType(file, kind);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await removeExistingEnterGateFiles(user.id);

  const ext = backgroundStorageExtension(kind, file);
  const path = `${user.id}/enter-gate.${ext}`;

  if (file.size > SIGNED_UPLOAD_THRESHOLD) {
    await uploadViaSignedUrl(supabase, path, file, contentType);
  } else {
    await uploadDirect(supabase, path, file, contentType);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("backgrounds").getPublicUrl(path);

  return { url: `${publicUrl}?v=${Date.now()}`, isVideo };
}

function finalizeUploadError(error: unknown, file: File, maxUploadBytes: number): Error {
  const message = error instanceof Error ? error.message : "Upload failed.";
  if (isStorageSizeError(message)) {
    return new Error(mapStorageUploadError(file.size, maxUploadBytes));
  }
  return error instanceof Error ? error : new Error(message);
}

export async function uploadEnterGateBackgroundToStorage(
  file: File,
  maxUploadBytes: number,
): Promise<{ url: string; isVideo: boolean }> {
  if (file.size === 0) {
    throw new Error("Please select a file.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error(backgroundUploadSizeError(file.size, maxUploadBytes));
  }

  await ensureStorageUploadLimitsAction();

  try {
    return await performEnterGateUpload(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    if (file.size <= maxUploadBytes && isStorageSizeError(message)) {
      await ensureStorageUploadLimitsAction();
      try {
        return await performEnterGateUpload(file);
      } catch (retryError) {
        throw finalizeUploadError(retryError, file, maxUploadBytes);
      }
    }
    throw finalizeUploadError(error, file, maxUploadBytes);
  }
}
