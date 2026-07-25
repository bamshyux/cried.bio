import { redirect } from "next/navigation";
import { syncFounderBadges, syncSignupBadgesAction } from "@/app/actions/badges";
import { GlobalSiteBanner } from "@/components/admin/global-site-banner";
import { DashboardLayoutBody } from "@/components/dashboard/dashboard-layout-body";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopChrome } from "@/components/dashboard/dashboard-top-chrome";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { PlatformUpdateShell } from "@/components/platform-updates/platform-update-shell";
import { getOnboardingState } from "@/lib/data/onboarding";
import { getProfileByUserId } from "@/lib/data/profiles";
import { resolveAppliedPresetId } from "@/lib/data/profile-presets";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { buildPublicProfileUrl } from "@/lib/profile/public-profile-url";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  await syncFounderBadges(userId);
  await syncSignupBadgesAction(userId);
  const { ensurePremiumDowngraded } = await import("@/lib/premium/sync");
  await ensurePremiumDowngraded(userId);
  const { syncActivePresetScheduleAction } = await import("@/app/actions/preset-schedules");
  await syncActivePresetScheduleAction();
  const email = (data.claims.email as string | undefined) ?? "User";
  const sessionId = data.claims.session_id as string | undefined;
  const { touchUserSession } = await import("@/lib/data/account-settings");
  await touchUserSession(userId, sessionId);
  const { data: userData } = await supabase.auth.getUser();
  const needsEmailVerification = Boolean(
    userData.user?.email && !userData.user.email_confirmed_at,
  );
  const profile = await getProfileByUserId(userId);
  const onboarding = await getOnboardingState(userId, profile?.username);
  const activePresetId = await resolveAppliedPresetId(userId);
  const adminAccess = await getAdminAccess();
  const showAdminPanel = !!adminAccess;

  return (
    <div className="bf-dash-root min-h-screen text-neutral-100">
      <GlobalSiteBanner />
      <DashboardTopChrome
        email={email}
        username={profile?.username}
        profileUrl={profile?.username ? buildPublicProfileUrl(profile.username) : null}
        activePresetId={activePresetId}
      />

      {needsEmailVerification && userData.user?.email ? (
        <EmailVerificationBanner email={userData.user.email} />
      ) : null}

      <PlatformUpdateShell />

      <DashboardShell
        needsSetupWizard={onboarding.needsSetupWizard}
        needsDashboardTour={onboarding.needsDashboardTour}
      >
        <DashboardLayoutBody showAdminPanel={showAdminPanel}>{children}</DashboardLayoutBody>
      </DashboardShell>
    </div>
  );
}
