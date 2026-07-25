"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isBadgeCreationPath } from "@/lib/store/badge-creation-route";

export function SetupRedirect({ needsSetupWizard }: { needsSetupWizard: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSetupRoute = pathname.startsWith("/dashboard/setup");
  const isBadgeCreationRoute = isBadgeCreationPath(pathname);

  useEffect(() => {
    if (needsSetupWizard && !isSetupRoute && !isBadgeCreationRoute) {
      router.replace("/dashboard/setup");
      return;
    }
    if (!needsSetupWizard && isSetupRoute) {
      router.replace("/dashboard");
    }
  }, [needsSetupWizard, isSetupRoute, isBadgeCreationRoute, router]);

  return null;
}
