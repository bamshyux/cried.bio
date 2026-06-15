import { notFound } from "next/navigation";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { getPublicViewCount } from "@/lib/data/analytics";
import { getActivityFeed } from "@/lib/data/activity";
import { getBadgesByProfileId } from "@/lib/data/badges";
import { getEmbedsByProfileId } from "@/lib/data/embeds";
import { getFeaturedBlocksByProfileId } from "@/lib/data/featured";
import { getGuestbookEntries } from "@/lib/data/guestbook";
import { getLinksByProfileId } from "@/lib/data/links";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import {
  getFollowCounts,
  getFriends,
  isFollowing,
} from "@/lib/data/social";
import { PublicProfileView } from "@/components/profile/public-profile";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile Not Found — cried.bio" };
  const displayName = profile.display_name || profile.username;
  return {
    title: `${displayName} — cried.bio`,
    description: profile.bio || `${displayName}'s cried.bio profile`,
  };
}

export default async function UsernamePage({ params }: PageProps) {
  const { username } = await params;
  const normalized = normalizeUsername(username);

  if (!isValidUsername(normalized)) notFound();

  const profile = await getProfileByUsername(normalized);
  if (!profile) notFound();

  await syncMilestoneBadges(profile.id);

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const currentUserId = authData?.claims?.sub as string | undefined;

  const [
    links,
    settings,
    badges,
    viewCount,
    embeds,
    featured,
    guestbook,
    activity,
    friends,
    followCounts,
    following,
  ] = await Promise.all([
    getLinksByProfileId(profile.id),
    getSettingsByProfileId(profile.id),
    getBadgesByProfileId(profile.id),
    getPublicViewCount(profile.id),
    getEmbedsByProfileId(profile.id, true),
    getFeaturedBlocksByProfileId(profile.id, true),
    getGuestbookEntries(profile.id),
    getActivityFeed(profile.id),
    getFriends(profile.id),
    getFollowCounts(profile.id),
    currentUserId ? isFollowing(currentUserId, profile.id) : Promise.resolve(false),
  ]);

  return (
    <PublicProfileView
      profile={profile}
      links={links}
      settings={settings}
      badges={badges}
      viewCount={viewCount}
      embeds={embeds}
      featured={featured}
      guestbook={guestbook}
      activity={activity}
      friends={settings.friends_visibility === "public" ? friends : []}
      followerCount={followCounts.followers}
      followingCount={followCounts.following}
      isFollowing={following}
      isLoggedIn={!!currentUserId}
      currentUserId={currentUserId}
    />
  );
}
