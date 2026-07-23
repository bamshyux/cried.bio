"use client";

import { ShareProfileButton } from "@/components/dashboard/share-profile-button";
import { ViewLiveProfileButton } from "@/components/dashboard/view-live-profile-button";

export function OverviewProfileActions({
  username,
  profileUrl,
}: {
  username: string;
  profileUrl: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <ViewLiveProfileButton username={username} variant="header" />
      <ShareProfileButton username={username} profileUrl={profileUrl} />
    </div>
  );
}
