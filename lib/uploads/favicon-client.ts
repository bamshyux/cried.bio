"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_FAVICON_SIZE = 512 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

async function removeExistingFavicons(userId: string) {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from("profiles").list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name.startsWith("favicon."))
    .map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await supabase.storage.from("profiles").remove(paths);
  }
}

export async function uploadProfileFaviconToStorage(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Please select a file.");
  }

  const isIco =
    file.type === "image/x-icon" ||
    file.type === "image/vnd.microsoft.icon" ||
    file.name.toLowerCase().endsWith(".ico");

  if (!ALLOWED_IMAGE_TYPES.has(file.type) && !isIco) {
    throw new Error("Favicons must be ICO, JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_FAVICON_SIZE) {
    throw new Error("Favicon images must be 512 KB or smaller.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await removeExistingFavicons(user.id);

  const ext = isIco
    ? "ico"
    : file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const path = `${user.id}/favicon.${ext}`;
  const contentType = isIco ? "image/x-icon" : file.type;

  const { error } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: true, contentType });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}
