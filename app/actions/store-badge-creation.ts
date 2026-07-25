"use server";

import { createClient } from "@/lib/supabase/server";
import { insertStoreCustomBadge } from "@/lib/badges/store-badge-create";
import { createNotification } from "@/lib/data/notifications";
import {
  consumeBadgeCredit,
  getCreditTypeForRoute,
  requireBadgeCreationAccess,
  type StoreBadgeCreationRoute,
} from "@/lib/store/badge-credits";
import type { BadgeFormState } from "@/lib/types/badge";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function revalidateAfterBadgeCreation(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard/store");
  if (profile?.username) revalidatePath(`/${profile.username}`);
}

export async function createPurchasedBadgeAction(
  _prev: BadgeFormState,
  formData: FormData,
): Promise<BadgeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const route = String(formData.get("route") ?? "") as StoreBadgeCreationRoute;
  if (!["static", "static-pack", "animated"].includes(route)) {
    return { error: "Invalid badge creation request." };
  }

  const credit = await requireBadgeCreationAccess(userId, route);
  if (!credit) {
    return { error: "You do not have an active badge purchase for this page." };
  }

  const expectedCreditType = getCreditTypeForRoute(route);
  if (credit.credit_type !== expectedCreditType) {
    return { error: "This purchase does not match this badge creation page." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const iconFile = formData.get("icon_image");

  if (!name) return { error: "Badge name is required." };
  if (name.length > 48) return { error: "Badge name must be 48 characters or fewer." };
  if (description.length > 280) return { error: "Badge bio must be 280 characters or fewer." };
  if (!(iconFile instanceof File) || iconFile.size === 0) {
    return { error: "Upload a badge image." };
  }

  const animated = route === "animated";

  try {
    const badge = await insertStoreCustomBadge({
      userId,
      name,
      description,
      iconFile,
      animated,
    });

    const consumed = await consumeBadgeCredit({
      creditId: credit.id,
      userId,
      badgeId: badge.badgeId,
    });

    if (consumed.error) {
      return { error: consumed.error };
    }

    await createNotification({
      userId,
      type: "badge_earned",
      title: `You earned the ${badge.name} badge`,
      body: description,
      data: { badge_name: badge.name, badge_slug: badge.slug },
    });

    await revalidateAfterBadgeCreation(userId);

    const remaining = credit.slots_total - credit.slots_used - 1;
    if (route === "static-pack" && remaining > 0) {
      return {
        success: `Badge "${name}" created! ${remaining} more to go.`,
      };
    }

    return {
      success: `Badge "${name}" created and added to your profile.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create badge.",
    };
  }
}
