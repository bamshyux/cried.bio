import { redirect } from "next/navigation";
import { syncFounderBadges, syncMilestoneBadges } from "@/app/actions/badges";
import { GlobalSiteBanner } from "@/components/admin/global-site-banner";
import { DashboardLayoutBody } from "@/components/dashboard/dashboard-layout-body";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopChrome } from "@/components/dashboard/dashboard-top-chrome";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { DatabaseUnavailableNotice } from "@/components/dev/database-unavailable-notice";
import { PlatformUpdateShell } from "@/components/platform-updates/platform-update-shell";
import { getOnboardingState } from "@/lib/data/onboarding";
import { getProfileByUserId } from "@/lib/data/profiles";
import { resolveAppliedPresetId } from "@/lib/data/profile-presets";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { isDatabaseUnavailableError, logDatabaseError } from "@/lib/db/errors";
import { buildPublicProfileUrl } from "@/lib/profile/public-profile-url";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let claims: { sub?: string; email?: string; session_id?: string } | null = null;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (data?.claims) {
      claims = data.claims as { sub?: string; email?: string; session_id?: string };
    } else if (error && isDatabaseUnavailableError(error)) {
      return <DatabaseUnavailableNotice />;
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return <DatabaseUnavailableNotice />;
    }
    logDatabaseError("dashboard layout auth", error);
    redirect("/login");
  }

  if (!claims?.sub) redirect("/login");

  const userId = claims.sub as string;
  try {
    await syncFounderBadges(userId);
    await syncMilestoneBadges(userId);
    const { ensurePremiumDowngraded } = await import("@/lib/premium/sync");
    await ensurePremiumDowngraded(userId);
    const { syncActivePresetScheduleAction } = await import("@/app/actions/preset-schedules");
    await syncActivePresetScheduleAction();
  } catch (error) {
    logDatabaseError("dashboard layout sync", error);
  }

  const email = claims.email ?? "User";
  const sessionId = claims.session_id;
  try {
    const { touchUserSession } = await import("@/lib/data/account-settings");
    await touchUserSession(userId, sessionId);
  } catch (error) {
    logDatabaseError("dashboard layout session", error);
  }

  let userData: { user?: { email?: string | null; email_confirmed_at?: string | null } | null } = {};
  try {
    const result = await supabase.auth.getUser();
    userData = result.data;
  } catch (error) {
    logDatabaseError("dashboard layout getUser", error);
  }
  const needsEmailVerification = Boolean(
    userData.user?.email && !userData.user.email_confirmed_at,
  );
  const profile = await getProfileByUserId(userId);
  const onboarding = await getOnboardingState(userId, profile?.username);
  const activePresetId = await resolveAppliedPresetId(userId).catch((error) => {
    logDatabaseError("dashboard layout preset", error);
    return null;
  });
  const adminAccess = await getAdminAccess().catch((error) => {
    logDatabaseError("dashboard layout admin", error);
    return null;
  });
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
