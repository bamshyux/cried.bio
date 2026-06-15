"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import type { ProfileFormState } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub as string;
}

async function uploadProfileImage(
  userId: string,
  file: File,
  type: "avatar" | "banner",
) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Images must be JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/${type}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path);

  return publicUrl;
}

async function deleteStoragePrefix(
  userId: string,
  bucket: "profiles" | "backgrounds",
  namePrefix: string,
) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(bucket).list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((f) => f.name.startsWith(namePrefix))
    .map((f) => `${userId}/${f.name}`);

  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

export async function removeProfileImageAction(
  type: "avatar" | "banner",
): Promise<ProfileFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const field = type === "avatar" ? "avatar_url" : "banner_url";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ [field]: null })
    .eq("id", userId);

  if (error) return { error: error.message };

  await deleteStoragePrefix(userId, "profiles", `${type}.`);

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  if (profile?.username) revalidatePath(`/${profile.username}`);

  return { success: `${type === "avatar" ? "Avatar" : "Banner"} removed.` };
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in to update your profile." };
  }

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!username) {
    return { error: "Username is required." };
  }

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–20 characters and use only lowercase letters, numbers, and underscores.",
    };
  }

  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username, avatar_url, banner_url")
    .eq("id", userId)
    .maybeSingle();

  const { data: usernameTaken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .maybeSingle();

  if (usernameTaken) {
    return { error: "That username is already taken." };
  }

  let avatarUrl = existingProfile?.avatar_url ?? null;
  let bannerUrl = existingProfile?.banner_url ?? null;

  try {
    const avatarFile = formData.get("avatar");
    if (avatarFile instanceof File && avatarFile.size > 0) {
      avatarUrl = await uploadProfileImage(userId, avatarFile, "avatar");
    }

    const bannerFile = formData.get("banner");
    if (bannerFile instanceof File && bannerFile.size > 0) {
      bannerUrl = await uploadProfileImage(userId, bannerFile, "banner");
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Image upload failed.",
    };
  }

  const profileData = {
    id: userId,
    username,
    display_name: displayName,
    bio,
    avatar_url: avatarUrl,
    banner_url: bannerUrl,
  };

  const { error } = existingProfile
    ? await supabase.from("profiles").update(profileData).eq("id", userId)
    : await supabase.from("profiles").insert(profileData);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);

  if (existingProfile?.username && existingProfile.username !== username) {
    revalidatePath(`/${existingProfile.username}`);
  }

  return { success: "Profile saved successfully." };
}
