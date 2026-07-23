import { ensureAccountPreferences } from "@/lib/data/account-settings";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingState } from "@/lib/types/onboarding";

function isMissingOnboardingColumns(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("onboarding_wizard_completed_at") ||
    message.includes("dashboard_tour_completed_at")
  );
}

export async function getOnboardingState(
  userId: string,
  username: string | null | undefined,
): Promise<OnboardingState> {
  await ensureAccountPreferences(userId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("account_preferences")
    .select("onboarding_wizard_completed_at, dashboard_tour_completed_at")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error && isMissingOnboardingColumns(error.message)) {
    return {
      wizardCompletedAt: null,
      tourCompletedAt: null,
      needsSetupWizard: !username,
      needsDashboardTour: false,
    };
  }

  const wizardCompletedAt = data?.onboarding_wizard_completed_at ?? null;
  const tourCompletedAt = data?.dashboard_tour_completed_at ?? null;

  return {
    wizardCompletedAt,
    tourCompletedAt,
    needsSetupWizard: !wizardCompletedAt && !username,
    needsDashboardTour: !tourCompletedAt && !!wizardCompletedAt,
  };
}
