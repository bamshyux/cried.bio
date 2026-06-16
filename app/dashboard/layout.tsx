import Link from "next/link";
import { redirect } from "next/navigation";
import { syncFounderBadges, syncSignupBadgesAction } from "@/app/actions/badges";
import { CriedLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ProfilePresetQuickSave } from "@/components/dashboard/profile-presets/profile-preset-quick-save";
import { ViewLiveProfileButton } from "@/components/dashboard/view-live-profile-button";
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
  const email = (data.claims.email as string | undefined) ?? "User";
  const sessionId = data.claims.session_id as string | undefined;
  const { touchUserSession } = await import("@/lib/data/account-settings");
  await touchUserSession(userId, sessionId);
  const { data: userData } = await supabase.auth.getUser();
  const needsEmailVerification = Boolean(
    userData.user?.email && !userData.user.email_confirmed_at,
  );
  const profile = await getProfileByUserId(userId);
  const activePresetId = await resolveAppliedPresetId(userId);
  const adminAccess = await getAdminAccess();
  const showAdminPanel = !!adminAccess;

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090909]/95 backdrop-blur-md">
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

      <DashboardShell>
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-10 lg:flex-row lg:items-start lg:gap-12 lg:px-10">
          <DashboardSidebar showAdminPanel={showAdminPanel} />
          <main className="min-w-0 flex-1 pb-16">{children}</main>
        </div>
      </DashboardShell>
    </div>
  );
}
