"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function removeExistingProfileImages(userId: string, type: "avatar" | "banner") {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from("profiles").list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name.startsWith(`${type}.`))
    .map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await supabase.storage.from("profiles").remove(paths);
  }
}

export async function uploadProfileImageToStorage(
  file: File,
  type: "avatar" | "banner",
): Promise<string> {
  if (file.size === 0) {
    throw new Error("Please select a file.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Images must be JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await removeExistingProfileImages(user.id, type);

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${user.id}/${type}.${ext}`;

  const { error } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}
