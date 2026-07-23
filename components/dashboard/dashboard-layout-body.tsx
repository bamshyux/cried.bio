"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { UpgradeModalProvider } from "@/components/premium/upgrade-modal";

export function DashboardLayoutBody({
  children,
  showAdminPanel,
}: {
  children: React.ReactNode;
  showAdminPanel: boolean;
}) {
  const pathname = usePathname();
  const isSetupRoute = pathname.startsWith("/dashboard/setup");

  if (isSetupRoute) {
    return <main className="min-w-0 flex-1">{children}</main>;
  }

  return (
    <UpgradeModalProvider>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-10 lg:flex-row lg:items-start lg:gap-12 lg:px-10">
        <DashboardSidebar showAdminPanel={showAdminPanel} />
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </UpgradeModalProvider>
  );
}
