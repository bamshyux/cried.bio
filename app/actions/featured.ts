"use server";

import { getAuthenticatedUserId } from "@/lib/actions/auth";
import { revalidateAfterProfileAppearanceChange } from "@/lib/profile-presets/revalidate";
import { countFeaturedBlocks } from "@/lib/data/featured";
import { getPremiumEntitlements } from "@/lib/data/premium";
import { logActivity } from "@/lib/data/activity";
import type { FeaturedBlockType, FeaturedFormState } from "@/lib/types/featured";
import { MAX_FEATURED_BLOCKS } from "@/lib/types/featured";
import { createClient } from "@/lib/supabase/server";

const MAX_FEATURED_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FEATURED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function uploadFeaturedImage(userId: string, file: File): Promise<string> {
  if (!ALLOWED_FEATURED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Images must be JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_FEATURED_IMAGE_SIZE) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/featured/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}

async function resolveFeaturedThumbnail(
  userId: string,
  blockType: FeaturedBlockType,
  formData: FormData,
): Promise<string | null> {
  const thumbnailUrl = String(formData.get("thumbnail_url") ?? "").trim() || null;
  const imageFile = formData.get("image_file");

  if (imageFile instanceof File && imageFile.size > 0) {
    return uploadFeaturedImage(userId, imageFile);
  }

  if (blockType === "image" && !thumbnailUrl) {
    throw new Error("Image blocks need an uploaded image or image URL.");
  }

  return thumbnailUrl;
}

export async function createFeaturedBlockAction(
  _prev: FeaturedFormState,
  formData: FormData,
): Promise<FeaturedFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const title = String(formData.get("title") ?? "").trim();
  const blockType = String(formData.get("block_type") ?? "link") as FeaturedBlockType;
  const description = String(formData.get("description") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const accentColor = String(formData.get("accent_color") ?? "#fafafa");

  if (!title) return { error: "Title is required." };

  let thumbnailUrl: string | null;
  try {
    thumbnailUrl = await resolveFeaturedThumbnail(userId, blockType, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Image upload failed." };
  }

  const entitlements = await getPremiumEntitlements(userId);
  const count = await countFeaturedBlocks(userId);
  if (count >= entitlements.max_featured_blocks) {
    return { error: `Maximum ${entitlements.max_featured_blocks} featured blocks reached.` };
  }
  if (count >= MAX_FEATURED_BLOCKS && entitlements.max_featured_blocks <= MAX_FEATURED_BLOCKS) {
    return { error: `Maximum ${MAX_FEATURED_BLOCKS} featured blocks reached.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("featured_blocks").insert({
    profile_id: userId,
    block_type: blockType,
    title,
    description,
    url,
    accent_color: accentColor,
    thumbnail_url: thumbnailUrl,
    sort_order: count,
  });

  if (error) return { error: error.message };
  await logActivity(userId, "profile_updated", `Added featured block: ${title}`);
  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/featured"]);
  return { success: "Featured block created." };
}

export async function updateFeaturedBlockAction(
  _prev: FeaturedFormState,
  formData: FormData,
): Promise<FeaturedFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return { error: "Invalid block." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("featured_blocks")
    .update({
      title,
      description: String(formData.get("description") ?? "").trim(),
      url: String(formData.get("url") ?? "").trim(),
      accent_color: String(formData.get("accent_color") ?? "#fafafa"),
      block_type: String(formData.get("block_type") ?? "link"),
      thumbnail_url: String(formData.get("thumbnail_url") ?? "").trim() || null,
    })
    .eq("id", id)
    .eq("profile_id", userId);

  if (error) return { error: error.message };
  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/featured"]);
  return { success: "Block updated." };
}

export async function toggleFeaturedBlockAction(blockId: string, enabled: boolean) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase
    .from("featured_blocks")
    .update({ is_enabled: enabled })
    .eq("id", blockId)
    .eq("profile_id", userId);

  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/featured"]);
  return { success: true };
}

export async function deleteFeaturedBlockAction(blockId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase.from("featured_blocks").delete().eq("id", blockId).eq("profile_id", userId);
  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/featured"]);
  return { success: true };
}

export async function reorderFeaturedBlocksAction(ids: string[]) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("featured_blocks")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("profile_id", userId),
    ),
  );

  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/featured"]);
  return { success: true };
}
