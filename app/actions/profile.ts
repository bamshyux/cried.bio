"use server";

import { sendNewAccountDiscordAlert } from "@/lib/discord/signup-webhook";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import type { ProfileFormState } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub as string;
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

export async function saveProfileImageAction(
  type: "avatar" | "banner",
  imageUrl: string,
): Promise<ProfileFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!imageUrl.trim()) return { error: "Invalid image URL." };

  const supabase = await createClient();
  const field = type === "avatar" ? "avatar_url" : "banner_url";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ [field]: imageUrl })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  if (profile?.username) revalidatePath(`/${profile.username}`);

  return { success: `${type === "avatar" ? "Avatar" : "Banner"} updated.` };
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

  const usernameError = await rejectIfModerated(username, "username", userId);
  if (usernameError) return { error: usernameError };

  const displayNameError = await rejectIfModerated(displayName, "display_name", userId);
  if (displayNameError) return { error: displayNameError };

  const bioError = await rejectIfModerated(bio, "bio", userId);
  if (bioError) return { error: bioError };

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

  const hadUsername = Boolean(existingProfile?.username?.trim());
  if (!hadUsername) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    void sendNewAccountDiscordAlert({
      email: user?.email ?? "Unknown",
      username,
      displayName,
      userId,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);

  if (existingProfile?.username && existingProfile.username !== username) {
    revalidatePath(`/${existingProfile.username}`);
  }

  return { success: "Profile saved successfully." };
}
