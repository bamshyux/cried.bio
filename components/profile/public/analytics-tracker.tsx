"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { canRecordLinkClick, canRecordProfileView } from "@/lib/analytics/consent";
import {
  getSessionId,
  getVisitorId,
  hasRecordedProfileView,
  markProfileViewRecorded,
} from "@/lib/analytics/visitor";

export function AnalyticsTracker({ profileId }: { profileId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!canRecordProfileView()) return;
    if (hasRecordedProfileView(profileId)) return;

    const visitorHash = getVisitorId();

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        profileId,
        eventType: "profile_view",
        visitorHash,
      }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as {
          ok?: boolean;
          recorded?: boolean;
          deduplicated?: boolean;
        } | null;
        if (data?.recorded || data?.deduplicated) {
          markProfileViewRecorded(profileId);
        }
        if (data?.recorded) {
          router.refresh();
        }
      })
      .catch(() => {});
  }, [profileId, router]);

  return null;
}

export function trackLinkClick(profileId: string, linkId: string) {
  if (!canRecordLinkClick()) return;
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId,
      eventType: "link_click",
      linkId,
      visitorHash: getVisitorId(),
      sessionId: getSessionId(),
    }),
  }).catch(() => {});
}
