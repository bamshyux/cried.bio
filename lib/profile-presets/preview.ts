import { mergeSettings } from "@/lib/settings";
import { scopeProfileCss } from "@/lib/themes/scope-css";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileLink } from "@/lib/types/link";
import type { Profile } from "@/lib/types/profile";
import type { ProfilePresetData } from "@/lib/types/profile-preset";
import type { ProfileSettings, ProfileLayout } from "@/lib/types/settings";

function previewTimestamp() {
  return new Date().toISOString();
}

export function buildProfileViewFromPreset({
  baseProfile,
  baseBadges,
  presetData,
}: {
  baseProfile: Profile;
  baseBadges: ProfileBadge[];
  presetData: ProfilePresetData;
}): {
  profile: Profile;
  settings: ProfileSettings;
  links: ProfileLink[];
  embeds: ProfileEmbed[];
  featured: FeaturedBlock[];
  badges: ProfileBadge[];
  scopedCustomCss: string | null;
} {
  const profileId = baseProfile.id;
  const now = previewTimestamp();

  const profile: Profile = {
    ...baseProfile,
    display_name: presetData.profile.display_name,
    bio: presetData.profile.bio,
    avatar_url: presetData.profile.avatar_url,
    banner_url: presetData.profile.banner_url,
  };

  const presetLayout = presetData.settings.layout as ProfileLayout | undefined;
  const settings = mergeSettings(
    {
      ...(presetData.settings as Partial<ProfileSettings>),
      show_discord_status: presetData.discordWidget?.is_enabled ?? false,
      discord_card_config: presetData.discordWidget?.config ?? undefined,
      layout: presetData.customTheme?.css?.trim() ? "custom" : presetLayout,
    },
    profileId,
  );

  const sortedLinks = [...presetData.links].sort((a, b) => a.sort_order - b.sort_order);
  const featuredIndex =
    presetData.featuredLinkIndex != null && presetData.featuredLinkIndex >= 0
      ? presetData.featuredLinkIndex
      : sortedLinks.findIndex((link) => link.is_featured);

  settings.featured_link_id =
    featuredIndex >= 0 && featuredIndex < sortedLinks.length
      ? `preview-link-${featuredIndex}`
      : null;

  const links: ProfileLink[] = sortedLinks.map((link, index) => ({
    id: `preview-link-${index}`,
    profile_id: profileId,
    title: link.title,
    url: link.url,
    icon: link.icon,
    color: link.color,
    background_color: link.background_color,
    animation: link.animation,
    is_featured: link.is_featured,
    sort_order: index,
    created_at: now,
  }));

  const embeds: ProfileEmbed[] = presetData.embeds
    .filter((embed) => embed.is_visible)
    .map((embed, index) => ({
      id: `preview-embed-${index}`,
      profile_id: profileId,
      embed_type: embed.embed_type,
      url: embed.url,
      title: embed.title,
      embed_id: embed.embed_id,
      is_visible: embed.is_visible,
      sort_order: embed.sort_order,
      config: embed.config,
      created_at: now,
      updated_at: now,
    }));

  const featured: FeaturedBlock[] = presetData.featuredBlocks
    .filter((block) => block.is_enabled)
    .map((block, index) => ({
      id: `preview-featured-${index}`,
      profile_id: profileId,
      block_type: block.block_type,
      title: block.title,
      description: block.description,
      thumbnail_url: block.thumbnail_url,
      url: block.url,
      accent_color: block.accent_color,
      is_enabled: block.is_enabled,
      sort_order: block.sort_order,
      created_at: now,
      updated_at: now,
    }));

  const presetBadgeMap = new Map(presetData.profileBadges.map((badge) => [badge.badge_id, badge]));
  const badges = baseBadges
    .map((badge) => {
      const presetBadge = presetBadgeMap.get(badge.id);
      if (!presetBadge) return badge;
      return {
        ...badge,
        is_visible: presetBadge.is_visible,
        is_featured: presetBadge.is_featured,
        sort_order: presetBadge.sort_order,
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  let scopedCustomCss: string | null = null;
  if (presetData.customTheme?.css?.trim()) {
    scopedCustomCss = scopeProfileCss(presetData.customTheme.css).css || null;
  }

  return { profile, settings, links, embeds, featured, badges, scopedCustomCss };
}

export function createPreviewBaseProfile(username: string, id = "preset-preview"): Profile {
  const now = previewTimestamp();
  return {
    id,
    uid: null,
    username,
    display_name: username,
    bio: "",
    avatar_url: null,
    banner_url: null,
    created_at: now,
    updated_at: now,
  };
}
