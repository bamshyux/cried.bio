import type { ActivityEvent } from "@/lib/types/activity";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { GuestbookEntry } from "@/lib/types/guestbook";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileLink } from "@/lib/types/link";
import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import type { SocialProfile } from "@/lib/types/social";
import { PublicProfileClient } from "./public/public-profile-client";

export function PublicProfileView({
  profile,
  links,
  settings,
  badges,
  viewCount,
  embeds,
  featured,
  guestbook,
  activity,
  friends,
  followerCount,
  followingCount,
  isFollowing,
  isLoggedIn,
  currentUserId,
}: {
  profile: Profile;
  links: ProfileLink[];
  settings: ProfileSettings;
  badges: ProfileBadge[];
  viewCount: number;
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  guestbook: GuestbookEntry[];
  activity: ActivityEvent[];
  friends: SocialProfile[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
}) {
  return (
    <PublicProfileClient
      profile={profile}
      links={links}
      settings={settings}
      badges={badges}
      viewCount={viewCount}
      embeds={embeds}
      featured={featured}
      guestbook={guestbook}
      activity={activity}
      friends={friends}
      followerCount={followerCount}
      followingCount={followingCount}
      isFollowing={isFollowing}
      isLoggedIn={isLoggedIn}
      currentUserId={currentUserId}
    />
  );
}
