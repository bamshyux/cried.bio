import Link from "next/link";
import { redirect } from "next/navigation";
import { syncFounderBadges, syncSignupBadgesAction } from "@/app/actions/badges";
import { CriedLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardLayoutBody } from "@/components/dashboard/dashboard-layout-body";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { ProfilePresetQuickSave } from "@/components/dashboard/profile-presets/profile-preset-quick-save";
import { ViewLiveProfileButton } from "@/components/dashboard/view-live-profile-button";
import { PlatformUpdateShell } from "@/components/platform-updates/platform-update-shell";
import { getOnboardingState } from "@/lib/data/onboarding";
import { getProfileByUserId } from "@/lib/data/profiles";
import { resolveAppliedPresetId } from "@/lib/data/profile-presets";
import { getAdminAccess } from "@/lib/auth/admin-access";
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
      <header className="bf-dash-header sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
          <Link href="/dashboard" className="shrink-0">
            <CriedLogo size={28} />
          </Link>

          <div className="flex flex-1 items-center justify-center px-2">
            <DashboardSearch />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ProfilePresetQuickSave activePresetId={activePresetId} />
            <ViewLiveProfileButton username={profile?.username} />
            <span className="hidden h-4 w-px bg-white/[0.08] md:block" aria-hidden />
            <span className="hidden max-w-[160px] truncate text-[13px] text-neutral-500 xl:inline">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

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
