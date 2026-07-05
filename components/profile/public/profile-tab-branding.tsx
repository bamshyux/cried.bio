"use client";

import { useEffect } from "react";
import { buildProfileTabTitle, runTabTitleAnimation } from "@/lib/profile/tab-title";
import type { TabTitleAnimation } from "@/lib/types/settings";

export function ProfileTabBranding({
  displayName,
  faviconUrl,
  tabTitleAnimation,
}: {
  displayName: string;
  faviconUrl: string | null;
  tabTitleAnimation: TabTitleAnimation;
}) {
  const fullTitle = buildProfileTabTitle(displayName);

  useEffect(() => {
    if (typeof document === "undefined") return;

    return runTabTitleAnimation(fullTitle, tabTitleAnimation, (title) => {
      document.title = title;
    });
  }, [fullTitle, tabTitleAnimation]);

  useEffect(() => {
    if (typeof document === "undefined" || !faviconUrl) return;

    let link = document.querySelector<HTMLLinkElement>("link[data-profile-favicon='true']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-profile-favicon", "true");
      document.head.appendChild(link);
    }

    link.href = faviconUrl;

    let appleLink = document.querySelector<HTMLLinkElement>("link[data-profile-apple-icon='true']");
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      appleLink.setAttribute("data-profile-apple-icon", "true");
      document.head.appendChild(appleLink);
    }

    appleLink.href = faviconUrl;

    return () => {
      link?.remove();
      appleLink?.remove();
    };
  }, [faviconUrl]);

  return null;
}
