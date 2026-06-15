"use client";

import { useEffect } from "react";
import { getSessionId, getVisitorId } from "@/lib/analytics/visitor";

export function AnalyticsTracker({ profileId }: { profileId: string }) {
  useEffect(() => {
    const visitorHash = getVisitorId();
    const sessionId = getSessionId();

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        eventType: "profile_view",
        visitorHash,
        sessionId,
      }),
    }).catch(() => {});
  }, [profileId]);

  return null;
}

export function trackLinkClick(profileId: string, linkId: string) {
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
