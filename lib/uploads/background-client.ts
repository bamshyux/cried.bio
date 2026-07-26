"use client";

import { createClient } from "@/lib/supabase/client";
import {
  backgroundStorageExtension,
  backgroundUploadContentType,
  resolveBackgroundUploadKind,
} from "@/lib/uploads/background-media";
import { backgroundUploadSizeError, MAX_BACKGROUND_UPLOAD_BYTES } from "@/lib/uploads/limits";

const SIGNED_UPLOAD_THRESHOLD = 6 * 1024 * 1024;

async function removeExistingBackgroundFiles(userId: string) {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from("backgrounds").list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name.startsWith("background."))
    .map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await supabase.storage.from("backgrounds").remove(paths);
  }
}

function isStorageSizeError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("size") ||
    msg.includes("large") ||
    msg.includes("payload") ||
    msg.includes("maximum") ||
    msg.includes("too big") ||
    msg.includes("entity too large") ||
    (msg.includes("limit") && !msg.includes("rate"))
  );
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

  if (signError) {
    if (isStorageSizeError(signError.message)) {
      throw new Error(backgroundUploadSizeError(file.size));
    }
    throw new Error(signError.message);
  }

  const { error: uploadError } = await supabase.storage
    .from("backgrounds")
    .uploadToSignedUrl(path, data.token, file, { contentType });

  if (uploadError) {
    if (isStorageSizeError(uploadError.message)) {
      throw new Error(backgroundUploadSizeError(file.size));
    }
    throw new Error(uploadError.message);
  }
}

export async function uploadBackgroundToStorage(
  file: File,
): Promise<{ url: string; isVideo: boolean }> {
  if (file.size === 0) {
    throw new Error("Please select a file.");
  }

  if (file.size > MAX_BACKGROUND_UPLOAD_BYTES) {
    throw new Error(backgroundUploadSizeError(file.size));
  }

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

  await removeExistingBackgroundFiles(user.id);

  const ext = backgroundStorageExtension(kind, file);
  const path = `${user.id}/background.${ext}`;

  if (file.size > SIGNED_UPLOAD_THRESHOLD) {
    await uploadViaSignedUrl(supabase, path, file, contentType);
  } else {
    const { error } = await supabase.storage
      .from("backgrounds")
      .upload(path, file, { upsert: true, contentType });

    if (error) {
      if (isStorageSizeError(error.message)) {
        throw new Error(backgroundUploadSizeError(file.size));
      }
      throw new Error(error.message);
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("backgrounds").getPublicUrl(path);

  return { url: `${publicUrl}?v=${Date.now()}`, isVideo };
}
