"use server";

import { updateProfileAction } from "@/app/actions/profile";
import { createSocialLinkAction } from "@/app/actions/links";
import { ensureAccountPreferences } from "@/lib/data/account-settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingActionState } from "@/lib/types/onboarding";
import type { ProfileLayout } from "@/lib/types/settings";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

function isMissingOnboardingColumns(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("onboarding_wizard_completed_at") ||
    message.includes("dashboard_tour_completed_at")
  );
}

export async function validateOnboardingUsernameAction(
  username: string,
): Promise<OnboardingActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const normalized = normalizeUsername(username);
  if (!normalized) return { error: "Username is required." };
  if (!isValidUsername(normalized)) {
    return {
      error:
        "Username must be 3–20 characters and use only lowercase letters, numbers, and underscores.",
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (existing && existing.id !== userId) {
    return { error: "That username is already taken." };
  }

  return { success: "Username is available." };
}

export async function saveOnboardingLayoutAction(
  layout: ProfileLayout,
): Promise<OnboardingActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update({ layout })
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/setup");
  return { success: "Layout saved." };
}

export async function publishOnboardingProfileAction(input: {
  username: string;
  displayName: string;
}): Promise<OnboardingActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const formData = new FormData();
  formData.set("username", input.username);
  formData.set("displayName", input.displayName);
  formData.set("bio", "");
  formData.set("location", "");

  const profileResult = await updateProfileAction({}, formData);
  if (profileResult.error) return { error: profileResult.error };

  await ensureAccountPreferences(userId);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("account_preferences")
    .update({ onboarding_wizard_completed_at: now })
    .eq("profile_id", userId);

  if (error) {
    if (isMissingOnboardingColumns(error.message)) {
      revalidatePath("/dashboard");
      return { success: "Profile published." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/setup");
  return { success: "Profile published." };
}

export async function addOnboardingSocialLinkAction(
  platform: string,
  value: string,
): Promise<OnboardingActionState> {
  const formData = new FormData();
  formData.set("platform", platform);
  formData.set("input", value);
  const result = await createSocialLinkAction({}, formData);
  if (result.error) return { error: result.error };
  return { success: result.success ?? "Link added." };
}

export async function completeDashboardTourAction(): Promise<OnboardingActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  await ensureAccountPreferences(userId);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("account_preferences")
    .update({ dashboard_tour_completed_at: now })
    .eq("profile_id", userId);

  if (error) {
    if (isMissingOnboardingColumns(error.message)) {
      return { success: "Tour dismissed." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Tour completed." };
}

export async function restartDashboardTourAction(): Promise<OnboardingActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  await ensureAccountPreferences(userId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_preferences")
    .update({ dashboard_tour_completed_at: null })
    .eq("profile_id", userId);

  if (error) {
    if (isMissingOnboardingColumns(error.message)) {
      return { error: "Run supabase/v69_onboarding.sql to enable the dashboard tour." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { success: "Dashboard tour restarted." };
}
