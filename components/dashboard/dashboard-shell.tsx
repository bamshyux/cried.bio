"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DashboardFormTracker,
  UnsavedChangesNotice,
  UnsavedChangesProvider,
} from "@/components/dashboard/unsaved-changes";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import { SetupRedirect } from "@/components/onboarding/setup-redirect";
import { isBadgeCreationPath } from "@/lib/store/badge-creation-route";

const FORCE_TOUR_STORAGE_KEY = "bf_dashboard_tour_force";

function readForcedTourRestart() {
  try {
    if (sessionStorage.getItem(FORCE_TOUR_STORAGE_KEY) === "1") {
      sessionStorage.removeItem(FORCE_TOUR_STORAGE_KEY);
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

export function markDashboardTourForcedRestart() {
  try {
    sessionStorage.setItem(FORCE_TOUR_STORAGE_KEY, "1");
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event("bf-dashboard-tour-force"));
}

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
  const [forcedTour, setForcedTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const isSetupRoute = pathname.startsWith("/dashboard/setup");
  const isBadgeCreationRoute = isBadgeCreationPath(pathname);
  const showTour =
    (needsDashboardTour || forcedTour) &&
    !isSetupRoute &&
    !isBadgeCreationRoute &&
    !pathname.startsWith("/dashboard/admin");

  useEffect(() => {
    const activateForcedTour = () => {
      if (!readForcedTourRestart()) return;
      setForcedTour(true);
      setTourKey((key) => key + 1);
    };

    activateForcedTour();
    window.addEventListener("bf-dashboard-tour-force", activateForcedTour);
    return () => window.removeEventListener("bf-dashboard-tour-force", activateForcedTour);
  }, [pathname]);

  return (
    <UnsavedChangesProvider>
      <div className="bf-dash-shell relative z-0">
        <SetupRedirect needsSetupWizard={needsSetupWizard} />
        <UnsavedChangesNotice />
        <DashboardTour
          key={tourKey}
          active={showTour}
          onFinished={() => setForcedTour(false)}
        />
        <DashboardFormTracker>{children}</DashboardFormTracker>
      </div>
    </UnsavedChangesProvider>
  );
}
