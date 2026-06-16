import { notFound } from "next/navigation";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { getActiveCustomTheme } from "@/lib/data/custom-themes";
import {
  getCommunityThemeListingById,
  getPresetPreviewData,
} from "@/lib/data/community-themes";
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
import { buildProfileViewFromPreset } from "@/lib/profile-presets/preview";
import { parsePresetData } from "@/lib/profile-presets/snapshot";
import { PublicProfileView } from "@/components/profile/public-profile";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Profile } from "@/lib/types/profile";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileSettings } from "@/lib/types/settings";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ previewPreset?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile Not Found — cried.bio" };
  const displayName = profile.display_name || profile.username;
  const isPreview = Boolean(query.previewPreset);
  return {
    title: isPreview
      ? `Preview — ${displayName} — cried.bio`
      : `${displayName} — cried.bio`,
    description: profile.bio || `${displayName}'s cried.bio profile`,
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function UsernamePage({ params, searchParams }: PageProps) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const normalized = normalizeUsername(username);

  if (!isValidUsername(normalized)) notFound();

  const baseProfile = await getProfileByUsername(normalized);
  if (!baseProfile) notFound();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const currentUserId = authData?.claims?.sub as string | undefined;

  const visibility = await getProfileVisibility(baseProfile.id);
  if (visibility === "private" && currentUserId !== baseProfile.id) {
    notFound();
  }

  const isOwnProfile = currentUserId === baseProfile.id;
  const previewListingId = query.previewPreset?.trim() || null;
  const isPresetPreview = Boolean(isOwnProfile && previewListingId);

  if (!isPresetPreview) {
    await syncMilestoneBadges(baseProfile.id);
  }

  if (isOwnProfile && !isPresetPreview) {
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
    getLinksByProfileId(baseProfile.id),
    getSettingsByProfileId(baseProfile.id),
    getBadgesByProfileId(baseProfile.id),
    getPublicViewCount(baseProfile.id),
    getEmbedsByProfileId(baseProfile.id, true),
    getFeaturedBlocksByProfileId(baseProfile.id, true),
    getGuestbookEntries(baseProfile.id),
    getActivityFeed(baseProfile.id),
    getFriends(baseProfile.id),
    getFollowCounts(baseProfile.id),
    currentUserId ? isFollowing(currentUserId, baseProfile.id) : Promise.resolve(false),
    shouldHideViewCounts(baseProfile.id),
  ]);

  let profile: Profile = baseProfile;
  let previewSettings: ProfileSettings = settings;
  let previewLinks: ProfileLink[] = links;
  let previewBadges: ProfileBadge[] = badges;
  let previewEmbeds: ProfileEmbed[] = embeds;
  let previewFeatured: FeaturedBlock[] = featured;
  let scopedCustomCss: string | null = null;
  let presetPreviewTitle: string | null = null;

  if (isPresetPreview && previewListingId) {
    const listing = await getCommunityThemeListingById(previewListingId, currentUserId);
    if (
      listing?.listing_type === "profile_preset" &&
      (listing.visibility === "public" || listing.visibility === "open_source")
    ) {
      const preset = await getPresetPreviewData(listing.id, currentUserId);
      const presetData = preset?.preset_data ? parsePresetData(preset.preset_data) : null;

      if (presetData) {
        const preview = buildProfileViewFromPreset({
          baseProfile,
          baseBadges: badges,
          presetData,
          preserveViewerIdentity: true,
        });
        profile = preview.profile;
        previewSettings = preview.settings;
        previewLinks = preview.links;
        previewBadges = preview.badges;
        previewEmbeds = preview.embeds;
        previewFeatured = preview.featured;
        scopedCustomCss = preview.scopedCustomCss;
        presetPreviewTitle = listing.title;
      }
    }
  }

  if (hideViewCounts) {
    previewSettings.show_view_count = false;
  }

  const discordPresence = await getDiscordPresenceForSettings(previewSettings);

  if (!scopedCustomCss && previewSettings.layout === "custom" && previewSettings.custom_theme_id) {
    const theme = await getActiveCustomTheme(baseProfile.id, previewSettings.custom_theme_id);
    if (theme?.css) {
      scopedCustomCss = scopeProfileCss(theme.css).css || null;
    }
  }

  return (
    <PublicProfileView
      profile={profile}
      links={previewLinks}
      settings={previewSettings}
      badges={previewBadges}
      viewCount={viewCount}
      embeds={previewEmbeds}
      featured={previewFeatured}
      guestbook={guestbook}
      activity={activity}
      friends={previewSettings.friends_visibility === "public" ? friends : []}
      followerCount={followCounts.followers}
      followingCount={followCounts.following}
      isFollowing={following}
      isLoggedIn={!!currentUserId}
      currentUserId={currentUserId}
      discordPresence={discordPresence}
      scopedCustomCss={scopedCustomCss}
      presetPreviewTitle={presetPreviewTitle}
    />
  );
}
