"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BG_SIZE = 50 * 1024 * 1024;

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

export async function uploadBackgroundToStorage(
  file: File,
): Promise<{ url: string; isVideo: boolean }> {
  if (file.size === 0) {
    throw new Error("Please select a file.");
  }

  if (file.size > MAX_BG_SIZE) {
    throw new Error("File must be 50 MB or smaller.");
  }

  const isVideo = file.type === "video/mp4";
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new Error("Upload a JPEG, PNG, WebP, GIF, or MP4 file.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await removeExistingBackgroundFiles(user.id);

  const ext = isVideo ? "mp4" : file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${user.id}/background.${ext}`;

  const { error } = await supabase.storage
    .from("backgrounds")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("backgrounds").getPublicUrl(path);

  return { url: `${publicUrl}?v=${Date.now()}`, isVideo };
}
