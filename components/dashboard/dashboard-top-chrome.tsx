"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CriedLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { ProfilePresetQuickSave } from "@/components/dashboard/profile-presets/profile-preset-quick-save";
import { ShareProfileButton } from "@/components/dashboard/share-profile-button";
import { ViewLiveProfileButton } from "@/components/dashboard/view-live-profile-button";
import { isBadgeCreationPath } from "@/lib/store/badge-creation-route";

type DashboardTopChromeProps = {
  email: string;
  username?: string | null;
  profileUrl?: string | null;
  activePresetId: string | null;
};

export function DashboardTopChrome({
  email,
  username,
  profileUrl,
  activePresetId,
}: DashboardTopChromeProps) {
  const pathname = usePathname();
  const locked = isBadgeCreationPath(pathname);

  if (locked) {
    return (
      <header className="bf-dash-header border-b backdrop-blur-md">
        <div className="bf-dash-header-inner mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
          <div className="flex shrink-0 items-center gap-3">
            <CriedLogo size={28} />
            <span className="hidden h-4 w-px bg-white/[0.08] sm:block" aria-hidden />
            <p className="hidden text-[13px] font-medium text-violet-200/90 sm:block">
              Complete your badge setup
            </p>
          </div>

          <p className="flex-1 text-center text-xs text-neutral-500 sm:text-[13px]">
            Finish creating your badge before leaving this page
          </p>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[160px] truncate text-[13px] text-neutral-500 xl:inline">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bf-dash-header border-b backdrop-blur-md">
      <div className="bf-dash-header-inner mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
        <Link href="/dashboard" className="shrink-0">
          <CriedLogo size={28} />
        </Link>

        <div className="flex flex-1 items-center justify-center px-2">
          <DashboardSearch />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ProfilePresetQuickSave activePresetId={activePresetId} />
          {username && profileUrl ? (
            <>
              <ShareProfileButton username={username} profileUrl={profileUrl} />
              <ViewLiveProfileButton username={username} />
            </>
          ) : (
            <ViewLiveProfileButton username={username} />
          )}
          <span className="hidden h-4 w-px bg-white/[0.08] md:block" aria-hidden />
          <span className="hidden max-w-[160px] truncate text-[13px] text-neutral-500 xl:inline">
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
