"use server";

import { createClient } from "@/lib/supabase/server";
import { syncAllMilestoneBadges } from "@/lib/badges/sync-milestones";
import { syncSignupBadges } from "@/lib/badges/signup-badges";
import {
  getFounderUserId,
  isFounderBadgeSlug,
  isFounderProfile,
  syncFounderBadge,
} from "@/lib/badges/founder";
import {
  getBadgeIdBySlug,
  getBadgesByProfileId,
} from "@/lib/data/badges";
import { resolveUniqueBadgeSlug } from "@/lib/badges/slug";
import {
  isSummer2026ClaimActive,
  SUMMER_2026_BADGE_SLUG,
} from "@/lib/badges/seasonal-events";
import { uploadStoreBadgeIcon, validateStoreBadgeIcon } from "@/lib/badges/store-badge-create";
import { createNotification } from "@/lib/data/notifications";
import { formatSchemaError } from "@/lib/db/schema";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import type { BadgeFormState } from "@/lib/types/badge";
import { revalidateAfterProfileAppearanceChange } from "@/lib/profile-presets/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { revalidateProfileOg } from "@/lib/og/revalidate";

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
  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    revalidateProfileOg(profile.username);
  }
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
  const badgesCustomMonochrome = formData.get("badges_custom_monochrome") === "true";
  const badgesGlow = formData.get("badges_glow") === "true";
  const limit = parseInt(String(formData.get("badge_display_limit") ?? "5"), 10);
  const badgeDisplayLimit = Number.isFinite(limit) ? Math.min(20, Math.max(0, limit)) : 5;

  const patch = await omitUnsupportedSettingsColumns({
    show_badges: showBadges,
    badge_display_limit: badgeDisplayLimit,
    badges_monochrome: badgesMonochrome,
    badges_custom_monochrome: badgesCustomMonochrome,
    badges_glow: badgesGlow,
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };

  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/badges"]);
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

  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/badges"]);
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

  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/badges"]);
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
    .select("profile_id, badges(slug)")
    .eq("id", profileBadgeId)
    .maybeSingle();

  if (!row) return { error: "Badge assignment not found." };

  const badgeSlug = row.badges && !Array.isArray(row.badges)
    ? String((row.badges as { slug: string }).slug)
    : null;

  if (badgeSlug && isFounderBadgeSlug(badgeSlug)) {
    return { error: "The Founder badge cannot be removed." };
  }

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

  if (isFounderBadgeSlug(badgeSlug)) {
    const founderId = await getFounderUserId();
    if (!isFounderProfile(profileId, founderId)) {
      return { error: "The Founder badge can only be held by the cried.bio founder." };
    }
  }

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

export async function claimSummer2026BadgeAction(): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!isSummer2026ClaimActive()) return { error: "This event has ended." };

  const badgeId = await getBadgeIdBySlug(SUMMER_2026_BADGE_SLUG);
  if (!badgeId) return { error: "Summer Event badge is not available." };

  const admin = createAdminClient();
  if (!admin) return { error: "Unable to claim badge right now. Try again later." };

  const { data: existing } = await admin
    .from("profile_badges")
    .select("id")
    .eq("profile_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (existing) return { error: "You already claimed this badge." };

  const { error } = await admin.from("profile_badges").insert({
    profile_id: userId,
    badge_id: badgeId,
    award_source: "event",
  });

  if (error) {
    if (error.code === "23505") return { error: "You already claimed this badge." };
    return { error: error.message };
  }

  const { data: badge } = await admin
    .from("badges")
    .select("name, slug, description")
    .eq("id", badgeId)
    .maybeSingle();

  if (badge) {
    await createNotification({
      userId,
      type: "badge_earned",
      title: `You earned the ${badge.name} badge`,
      body: badge.description ?? "Summer 2026 exclusive event badge.",
      data: { badge_name: badge.name, badge_slug: badge.slug },
    });
  }

  await revalidateProfile(userId);
  return { success: "Summer Event badge claimed!" };
}

export async function createCustomBadgeAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "#fafafa").trim();
  const rarity = String(formData.get("rarity") ?? "rare");

  if (!username) return { error: "Username is required." };
  if (!name) return { error: "Badge name is required." };

  const iconFile = formData.get("icon_image");
  if (!(iconFile instanceof File) || iconFile.size === 0) {
    return { error: "Upload a badge image — that image is what shows on profiles." };
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: "User not found." };

  const slug = await resolveUniqueBadgeSlug(supabase, name);

  let iconUrl: string | null = null;
  try {
    iconUrl = await uploadBadgeIcon(slug, iconFile);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Badge image upload failed.",
    };
  }

  const { data: badge, error } = await supabase
    .from("badges")
    .insert({
      slug,
      name,
      icon: slug,
      icon_url: iconUrl,
      color,
      description,
      category: "custom",
      rarity,
      is_system: false,
      is_assignable: false,
    })
    .select("id, slug, name, description")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Badge slug already exists." };
    return { error: error.message };
  }

  const { error: assignError } = await supabase.from("profile_badges").insert({
    profile_id: profile.id,
    badge_id: badge.id,
    assigned_by: userId,
    award_source: "manual",
  });

  if (assignError) {
    if (assignError.code === "23505") {
      return { error: "That user already has this badge." };
    }
    return { error: assignError.message };
  }

  await createNotification({
    userId: profile.id,
    type: "badge_earned",
    title: `You earned the ${badge.name} badge`,
    body: badge.description ?? "",
    data: { badge_name: badge.name, badge_slug: badge.slug },
  });

  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard/admin/badges");
  if (profile.username) revalidatePath(`/${profile.username}`);

  return {
    success: `Custom badge "${name}" created and assigned to @${profile.username}.`,
  };
}

function isLikelyAnimatedStoreBadge(iconUrl: string | null | undefined): boolean {
  const normalized = iconUrl?.toLowerCase() ?? "";
  return normalized.includes(".gif") || normalized.includes("animated");
}

export async function updateCustomBadgeForAdminAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (!(await isAdmin(userId))) return { error: "Admin access required." };

  const badgeId = String(formData.get("badge_id") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "").trim();

  if (!badgeId) return { error: "Badge is required." };
  if (!username) return { error: "Username is required." };
  if (!name) return { error: "Badge name is required." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: "User not found." };

  const { data: assignment } = await supabase
    .from("profile_badges")
    .select("id, award_source, badges(id, slug, name, category, icon_url, rarity)")
    .eq("profile_id", profile.id)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (!assignment) return { error: "This badge is not assigned to that user." };

  const badge = assignment.badges && !Array.isArray(assignment.badges)
    ? (assignment.badges as {
        id: string;
        slug: string;
        name: string;
        category: string;
        icon_url: string | null;
        rarity: string;
      })
    : null;

  if (!badge) return { error: "Badge not found." };
  if (badge.category !== "custom") {
    return { error: "Only custom badges can be edited here." };
  }

  const isStoreBadge = assignment.award_source === "store";
  const updates: Record<string, string> = {
    name,
    description,
  };

  if (!isStoreBadge) {
    if (color) updates.color = color;
    if (rarity) updates.rarity = rarity;
  }

  const iconFile = formData.get("icon_image");
  if (iconFile instanceof File && iconFile.size > 0) {
    try {
      if (isStoreBadge) {
        const animated =
          isLikelyAnimatedStoreBadge(badge.icon_url) || iconFile.type === "image/gif";
        const validationError = validateStoreBadgeIcon(iconFile, animated);
        if (validationError) return { error: validationError };
        updates.icon_url = await uploadStoreBadgeIcon(badge.slug, iconFile, animated);
      } else {
        updates.icon_url = await uploadBadgeIcon(badge.slug, iconFile);
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Badge image upload failed.",
      };
    }
  }

  const { error } = await supabase.from("badges").update(updates).eq("id", badge.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard/admin/badges");
  if (profile.username) revalidatePath(`/${profile.username}`);

  return {
    success: `Custom badge "${name}" updated for @${profile.username}.`,
  };
}

/** Auto-award analytics milestone badges (idempotent) */
export async function syncMilestoneBadges(profileId: string): Promise<void> {
  await syncSignupBadges(profileId);
  await syncAllMilestoneBadges(profileId);
}

/** Auto-award Year One and OG signup badges (idempotent) */
export async function syncSignupBadgesAction(profileId: string): Promise<void> {
  await syncSignupBadges(profileId);
}

/** Keep the Founder badge exclusive and auto-award it to the founder account. */
export async function syncFounderBadges(profileId: string): Promise<void> {
  await syncFounderBadge(profileId);
}
