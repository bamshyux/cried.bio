"use client";

import { useEffect } from "react";
import {
  applyProfileFavicon,
  buildProfileFaviconPath,
  faviconMimeFromStoredUrl,
} from "@/lib/profile/favicon";
import { buildProfileTabTitle, runTabTitleAnimation } from "@/lib/profile/tab-title";
import type { TabTitleAnimation } from "@/lib/types/settings";

export function ProfileTabBranding({
  username,
  displayName,
  faviconUrl,
  tabTitleAnimation,
}: {
  username: string;
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
    const href = buildProfileFaviconPath(username, faviconUrl);
    if (!href) return;

    return applyProfileFavicon(href, faviconMimeFromStoredUrl(faviconUrl));
  }, [username, faviconUrl]);

  return null;
}
