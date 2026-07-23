"use client";

import { usePathname } from "next/navigation";
import {
  DashboardFormTracker,
  UnsavedChangesNotice,
  UnsavedChangesProvider,
} from "@/components/dashboard/unsaved-changes";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import { SetupRedirect } from "@/components/onboarding/setup-redirect";

export function DashboardShell({
  children,
  needsSetupWizard,
  needsDashboardTour,
}: {
  children: React.ReactNode;
  needsSetupWizard: boolean;
  needsDashboardTour: boolean;
}) {
  const pathname = usePathname();
  const isSetupRoute = pathname.startsWith("/dashboard/setup");
  const showTour = needsDashboardTour && !isSetupRoute && !pathname.startsWith("/dashboard/admin");

  return (
    <UnsavedChangesProvider>
      <div className="bf-dash-shell relative z-0">
        <SetupRedirect needsSetupWizard={needsSetupWizard} />
        <UnsavedChangesNotice />
        <DashboardTour active={showTour} />
        <DashboardFormTracker>{children}</DashboardFormTracker>
      </div>
    </UnsavedChangesProvider>
  );
}
