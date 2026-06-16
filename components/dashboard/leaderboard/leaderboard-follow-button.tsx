"use client";

import { useTransition, useState } from "react";
import { followUserAction, unfollowUserAction } from "@/app/actions/social";

export function LeaderboardFollowButton({
  profileId,
  initialFollowing,
  currentUserId,
}: {
  profileId: string;
  initialFollowing: boolean;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  if (currentUserId === profileId) return null;

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = following
        ? await unfollowUserAction(profileId)
        : await followUserAction(profileId);
      if (!result.error) setFollowing(!following);
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      className={`bf-leaderboard-follow rounded-xl border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
        following
          ? "border-white/[0.12] bg-white/[0.06] text-neutral-300 hover:border-red-400/30 hover:text-red-200"
          : "border-[var(--bf-accent)]/30 bg-[var(--bf-accent)]/10 text-white hover:border-[var(--bf-accent)]/50 hover:bg-[var(--bf-accent)]/20"
      }`}
    >
      {following ? "Unfollow" : "Follow"}
    </button>
  );
}
