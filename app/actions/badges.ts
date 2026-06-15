"use server";

import { createClient } from "@/lib/supabase/server";
import { syncAllMilestoneBadges } from "@/lib/badges/sync-milestones";
import {
  getBadgeIdBySlug,
  getBadgesByProfileId,
} from "@/lib/data/badges";
import { createNotification } from "@/lib/data/notifications";
import { formatSchemaError } from "@/lib/db/schema";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import type { BadgeFormState } from "@/lib/types/badge";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function revalidateProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard", "layout");
  if (profile?.username) revalidatePath(`/${profile.username}`);
}

async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.is_admin;
}

export async function updateBadgeDisplaySettingsAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const showBadges = formData.get("show_badges") === "true";
  const badgesMonochrome = formData.get("badges_monochrome") === "true";
  const limit = parseInt(String(formData.get("badge_display_limit") ?? "5"), 10);
  const badgeDisplayLimit = Number.isFinite(limit) ? Math.min(20, Math.max(0, limit)) : 5;

  const patch = await omitUnsupportedSettingsColumns({
    show_badges: showBadges,
    badge_display_limit: badgeDisplayLimit,
    badges_monochrome: badgesMonochrome,
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };

  await revalidateProfile(userId);
  return { success: "Badge display settings saved." };
}

export async function updateProfileBadgeAction(
  profileBadgeId: string,
  updates: { is_visible?: boolean; is_featured?: boolean },
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_badges")
    .update(updates)
    .eq("id", profileBadgeId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  await revalidateProfile(userId);
  return { success: "Badge updated." };
}

export async function reorderProfileBadgesAction(
  orderedProfileBadgeIds: string[],
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();

  for (let i = 0; i < orderedProfileBadgeIds.length; i++) {
    const { error } = await supabase
      .from("profile_badges")
      .update({ sort_order: i })
      .eq("id", orderedProfileBadgeIds[i])
      .eq("profile_id", userId);

    if (error) return { error: error.message };
  }

  await revalidateProfile(userId);
  return { success: "Badge order saved." };
}

export async function lookupUserBadgesForAdmin(username: string): Promise<{
  error?: string;
  profile?: { id: string; username: string; display_name: string | null };
  badges?: Awaited<ReturnType<typeof getBadgesByProfileId>>;
}> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const normalized = username.trim().toLowerCase();
  if (!normalized) return { error: "Enter a username." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", normalized)
    .maybeSingle();

  if (!profile?.username) return { error: "User not found." };

  const badges = await getBadgesByProfileId(profile.id);
  return { profile, badges };
}

export async function assignBadgeByUsernameAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const username = String(formData.get("username") ?? "").trim();
  const badgeSlug = String(formData.get("badge_slug") ?? "").trim();
  if (!username || !badgeSlug) return { error: "Username and badge are required." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) return { error: "User not found." };

  return assignBadgeAction(profile.id, badgeSlug);
}

export async function removeBadgeAssignmentAction(
  profileBadgeId: string,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("profile_badges")
    .select("profile_id")
    .eq("id", profileBadgeId)
    .maybeSingle();

  if (!row) return { error: "Badge assignment not found." };

  const { error } = await supabase.from("profile_badges").delete().eq("id", profileBadgeId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/badges");
  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", row.profile_id)
    .maybeSingle();
  if (target?.username) revalidatePath(`/${target.username}`);

  return { success: "Badge removed from user." };
}

const MAX_BADGE_ICON_SIZE = 2 * 1024 * 1024;
const ALLOWED_BADGE_ICON_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

async function uploadBadgeIcon(slug: string, file: File): Promise<string> {
  if (!ALLOWED_BADGE_ICON_TYPES.has(file.type)) {
    throw new Error("Badge images must be JPEG, PNG, WebP, GIF, or SVG.");
  }
  if (file.size > MAX_BADGE_ICON_SIZE) {
    throw new Error("Badge images must be 2 MB or smaller.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg").replace("svg+xml", "svg") ?? "png";
  const path = `${slug}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("badges")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from("badges").getPublicUrl(path);
  return publicUrl;
}

export async function assignBadgeAction(
  profileId: string,
  badgeSlug: string,
  awardSource = "manual",
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const badgeId = await getBadgeIdBySlug(badgeSlug);
  if (!badgeId) return { error: "Badge not found." };

  const supabase = await createClient();
  const { error } = await supabase.from("profile_badges").insert({
    profile_id: profileId,
    badge_id: badgeId,
    assigned_by: userId,
    award_source: awardSource,
  });

  if (error) {
    if (error.code === "23505") return { error: "Badge already assigned." };
    return { error: error.message };
  }

  const { data: badge } = await supabase
    .from("badges")
    .select("name, slug, description")
    .eq("id", badgeId)
    .maybeSingle();

  if (badge) {
    await createNotification({
      userId: profileId,
      type: "badge_earned",
      title: `You earned the ${badge.name} badge`,
      body: badge.description ?? "",
      data: { badge_name: badge.name, badge_slug: badge.slug },
    });
  }

  revalidatePath("/dashboard/badges");
  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();
  if (target?.username) revalidatePath(`/${target.username}`);
  return { success: "Badge assigned." };
}

export async function createCustomBadgeAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "#00e5cc").trim();
  const rarity = String(formData.get("rarity") ?? "rare");

  if (!name || !slug) return { error: "Name and slug are required." };

  let iconUrl: string | null = null;
  const iconFile = formData.get("icon_image");
  if (iconFile instanceof File && iconFile.size > 0) {
    try {
      iconUrl = await uploadBadgeIcon(slug, iconFile);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Badge image upload failed.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("badges").insert({
    slug,
    name,
    icon: iconUrl ? slug : "custom",
    icon_url: iconUrl,
    color,
    description,
    category: "custom",
    rarity,
    is_system: false,
    is_assignable: true,
  });

  if (error) {
    if (error.code === "23505") return { error: "Badge slug already exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard/badges");
  return { success: `Custom badge "${name}" created.` };
}

/** Auto-award analytics milestone badges (idempotent) */
export async function syncMilestoneBadges(profileId: string): Promise<void> {
  await syncAllMilestoneBadges(profileId);
}
