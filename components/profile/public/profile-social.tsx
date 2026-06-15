"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { followUserAction, unfollowUserAction } from "@/app/actions/social";
import type { ProfileSettings } from "@/lib/types/settings";
import type { SocialProfile } from "@/lib/types/social";
import { getStatusDisplay } from "@/lib/status";

export function ProfileStatusLine({ settings }: { settings: ProfileSettings }) {
  const { text, color } = getStatusDisplay(settings);
  if (!text) return null;

  return (
    <p className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span>{text}</span>
    </p>
  );
}

export function ProfileSocialBar({
  profileId,
  username,
  followerCount,
  followingCount,
  isFollowing: initialFollowing,
  isLoggedIn,
  showCounts = true,
  currentUserId,
}: {
  profileId: string;
  username: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
  showCounts?: boolean;
  currentUserId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  const toggle = () => {
    startTransition(async () => {
      const result = following
        ? await unfollowUserAction(profileId)
        : await followUserAction(profileId);
      if (!result.error) setFollowing(!following);
    });
  };

  const showFollowButton = isLoggedIn && currentUserId !== profileId;

  if (!showCounts && !showFollowButton) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
      {showCounts && (
        <>
          <Link href={`/${username}/followers`} className="transition-colors hover:text-white">
            <span className="font-semibold text-neutral-200">{followerCount.toLocaleString()}</span> followers
          </Link>
          <Link href={`/${username}/following`} className="transition-colors hover:text-white">
            <span className="font-semibold text-neutral-200">{followingCount.toLocaleString()}</span> following
          </Link>
        </>
      )}
      {showFollowButton && (
        <button
          type="button"
          disabled={isPending}
          onClick={toggle}
          className="rounded-lg border border-white/[0.08] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--bf-accent)]/40 hover:text-white disabled:opacity-50"
        >
          {following ? "Unfollow" : "Follow"}
        </button>
      )}
    </div>
  );
}

export function ProfileFriendsSection({
  friends,
  visibility,
}: {
  friends: SocialProfile[];
  visibility: ProfileSettings["friends_visibility"];
}) {
  if (visibility === "private" || friends.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-500">Friends</p>
      <div className="flex flex-wrap gap-2">
        {friends.map((friend) => (
          <Link
            key={friend.id}
            href={friend.username ? `/${friend.username}` : "#"}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-3 py-2 transition-colors hover:border-white/[0.1]"
          >
            {friend.avatar_url ? (
              <img src={friend.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold">
                {(friend.display_name || friend.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-neutral-300">{friend.display_name || friend.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
