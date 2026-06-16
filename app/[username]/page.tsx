import { notFound } from "next/navigation";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { getActiveCustomTheme } from "@/lib/data/custom-themes";
import { getDiscordPresenceForSettings } from "@/lib/data/discord-presence";
import { scopeProfileCss } from "@/lib/themes/scope-css";
import { getPublicViewCount } from "@/lib/data/analytics";
import { getProfileVisibility, shouldHideViewCounts } from "@/lib/data/account-settings";
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

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const currentUserId = authData?.claims?.sub as string | undefined;

  const visibility = await getProfileVisibility(profile.id);
  if (visibility === "private" && currentUserId !== profile.id) {
    notFound();
  }

  await syncMilestoneBadges(profile.id);

  if (currentUserId === profile.id) {
    try {
      const { refreshDiscordProfileAction, sanitizeDiscordConnectionAction } = await import(
        "@/app/actions/discord"
      );
      await sanitizeDiscordConnectionAction();
      await refreshDiscordProfileAction();
    } catch {
      // Discord sync is best-effort — never block the public profile from rendering.
    }
  }

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
    hideViewCounts,
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
    shouldHideViewCounts(profile.id),
  ]);

  if (hideViewCounts) {
    settings.show_view_count = false;
  }

  const discordPresence = await getDiscordPresenceForSettings(settings);

  let scopedCustomCss: string | null = null;
  if (settings.layout === "custom" && settings.custom_theme_id) {
    const theme = await getActiveCustomTheme(profile.id, settings.custom_theme_id);
    if (theme?.css) {
      scopedCustomCss = scopeProfileCss(theme.css).css || null;
    }
  }

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
      discordPresence={discordPresence}
      scopedCustomCss={scopedCustomCss}
    />
  );
}
