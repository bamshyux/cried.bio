import { notFound } from "next/navigation";
import { getBadgesByProfileId } from "@/lib/data/badges";
import { getDiscordPresenceForSettings } from "@/lib/data/discord-presence";
import { getPublicViewCount } from "@/lib/data/analytics";
import { getProfileVisibility, shouldHideViewCounts } from "@/lib/data/account-settings";
import { getActivityFeed } from "@/lib/data/activity";
import { getMusicTracks } from "@/lib/data/music-tracks";
import {
  getProfilePageBySlug,
  getSettingsByPageId,
  getLinksByPageId,
  getEmbedsByPageId,
  getFeaturedBlocksByPageId,
} from "@/lib/data/profile-pages";
import { getGuestbookEntries } from "@/lib/data/guestbook";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getFollowCounts, getFriends, isFollowing } from "@/lib/data/social";
import { PublicProfileView } from "@/components/profile/public-profile";
import { ProfileFaviconLinks } from "@/components/profile/profile-favicon-links";
import { isValidPageSlug, normalizePageSlug } from "@/lib/profile-pages/slug";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ username: string; pageSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, pageSlug } = await params;
  const profile = await getProfileByUsername(normalizeUsername(username));
  if (!profile) return { title: "Profile Not Found — cried.bio" };
  const page = await getProfilePageBySlug(profile.id, normalizePageSlug(pageSlug));
  const label = page?.label || page?.slug || pageSlug;
  return {
    title: `${page?.display_name || profile.display_name} — ${label} — cried.bio`,
  };
}

export default async function ProfileSubPage({ params }: PageProps) {
  const { username, pageSlug } = await params;
  const normalized = normalizeUsername(username);
  const slug = normalizePageSlug(pageSlug);

  if (!isValidUsername(normalized) || !isValidPageSlug(slug)) notFound();

  const baseProfile = await getProfileByUsername(normalized);
  if (!baseProfile) notFound();

  const page = await getProfilePageBySlug(baseProfile.id, slug);
  if (!page) notFound();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const currentUserId = authData?.claims?.sub as string | undefined;

  const visibility = await getProfileVisibility(baseProfile.id);
  if (visibility === "private" && currentUserId !== baseProfile.id) {
    notFound();
  }

  const profile: Profile = {
    ...baseProfile,
    display_name: page.display_name || baseProfile.display_name,
    bio: page.bio || baseProfile.bio,
    avatar_url: page.avatar_url ?? baseProfile.avatar_url,
    banner_url: page.banner_url ?? baseProfile.banner_url,
  };

  const [
    settings,
    links,
    embeds,
    featured,
    badges,
    viewCount,
    guestbook,
    activity,
    friends,
    followCounts,
    following,
    hideViewCounts,
    musicTracks,
  ] = await Promise.all([
    getSettingsByPageId(baseProfile.id, page.id),
    getLinksByPageId(baseProfile.id, page.id),
    getEmbedsByPageId(baseProfile.id, page.id),
    getFeaturedBlocksByPageId(baseProfile.id, page.id),
    getBadgesByProfileId(baseProfile.id),
    getPublicViewCount(baseProfile.id),
    getGuestbookEntries(baseProfile.id),
    getActivityFeed(baseProfile.id),
    getFriends(baseProfile.id),
    getFollowCounts(baseProfile.id),
    currentUserId ? isFollowing(currentUserId, baseProfile.id) : Promise.resolve(false),
    shouldHideViewCounts(baseProfile.id),
    getMusicTracks(baseProfile.id, page.id),
  ]);

  if (hideViewCounts) settings.show_view_count = false;

  const discordPresence = await getDiscordPresenceForSettings(settings);

  return (
    <>
      {settings.profile_favicon_url ? (
        <ProfileFaviconLinks
          username={profile.username ?? normalized}
          faviconUrl={settings.profile_favicon_url}
        />
      ) : null}
      <PublicProfileView
        profile={profile}
        links={links as import("@/lib/types/link").ProfileLink[]}
        settings={settings}
        badges={badges}
        viewCount={viewCount}
        embeds={embeds as import("@/lib/types/embed").ProfileEmbed[]}
        featured={featured as import("@/lib/types/featured").FeaturedBlock[]}
        guestbook={guestbook}
        activity={activity}
        friends={settings.friends_visibility === "public" ? friends : []}
        followerCount={followCounts.followers}
        followingCount={followCounts.following}
        isFollowing={following}
        isLoggedIn={!!currentUserId}
        currentUserId={currentUserId}
        discordPresence={discordPresence}
        musicTracks={musicTracks}
      />
    </>
  );
}
