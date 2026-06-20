import { getCustomThemeById } from "@/lib/data/custom-themes";
import { getDiscordStatusWidget } from "@/lib/data/discord-widget";
import { getEmbedsByProfileId } from "@/lib/data/embeds";
import { getFeaturedBlocksByProfileId } from "@/lib/data/featured";
import { getLinksByProfileId } from "@/lib/data/links";
import { getBadgesByProfileId } from "@/lib/data/badges";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import type {
  PRESET_DATA_VERSION,
  ProfilePresetData,
  ProfilePresetDiscordWidget,
} from "@/lib/types/profile-preset";
import type { ProfileSettings } from "@/lib/types/settings";
import { omitUnsupportedSettingsColumns, formatSchemaError } from "@/lib/db/validate-schema";
import {
  BACKGROUND_PRESET_SELECT,
  normalizePresetBackgroundSettings,
  pickBackgroundPresetSettings,
} from "@/lib/profile-presets/background-settings";
import { createClient } from "@/lib/supabase/server";

const SETTINGS_EXCLUDE = new Set([
  "profile_id",
  "created_at",
  "updated_at",
  "discord_user_id",
  "discord_username",
  "discord_avatar",
  "discord_banner",
  "discord_premium_type",
  "custom_theme_id",
  "active_preset_id",
  // Merged from profile_widgets at read time — not profile_settings columns
  "discord_card_config",
  "discord_card_style",
  "discord_show_lanyard_hint",
]);

function parsePresetSettingsRecord(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

async function readBackgroundColumnsFromDb(profileId: string): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select(BACKGROUND_PRESET_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();

  return (data ?? {}) as Record<string, unknown>;
}

function extractPresetSettings(settings: ProfileSettings): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!SETTINGS_EXCLUDE.has(key)) {
      result[key] = value;
    }
  }

  const background = pickBackgroundPresetSettings({ ...result, ...settings });
  return { ...result, ...background };
}

export type CapturePresetOptions = {
  /** Omit username, bio, links, and badges — shareable style/template only */
  styleOnly?: boolean;
};

export type ApplyPresetOptions = {
  /** Keep the installer's display name, bio, links, and badge visibility */
  preservePersonalContent?: boolean;
};

function finalizeStylePresetSnapshot(data: ProfilePresetData): ProfilePresetData {
  return {
    ...data,
    profile: {
      display_name: "",
      bio: "",
      avatar_url: data.profile.avatar_url,
      banner_url: data.profile.banner_url,
    },
    links: [],
    profileBadges: [],
    featuredLinkIndex: null,
    settings: {
      ...data.settings,
      featured_link_id: null,
    },
  };
}

function resolveFeaturedLinkIndex(
  links: Awaited<ReturnType<typeof getLinksByProfileId>>,
  featuredLinkId: string | null,
): number | null {
  if (!featuredLinkId) return null;
  const index = links.findIndex((link) => link.id === featuredLinkId);
  return index >= 0 ? index : null;
}

export async function captureProfilePresetSnapshot(
  userId: string,
  options?: CapturePresetOptions,
): Promise<ProfilePresetData> {
  const [profile, settings, backgroundColumns, links, embeds, featuredBlocks, profileBadges, discordWidget] =
    await Promise.all([
      getProfileByUserId(userId),
      getSettingsByProfileId(userId),
      readBackgroundColumnsFromDb(userId),
      getLinksByProfileId(userId),
      getEmbedsByProfileId(userId),
      getFeaturedBlocksByProfileId(userId),
      getBadgesByProfileId(userId),
      getDiscordStatusWidget(userId),
    ]);

  const settingsForPreset = {
    ...settings,
    ...normalizePresetBackgroundSettings({
      ...settings,
      ...backgroundColumns,
    }),
  } as ProfileSettings;

  let customTheme: ProfilePresetData["customTheme"] = null;
  if (settingsForPreset.layout === "custom" && settingsForPreset.custom_theme_id) {
    const theme = await getCustomThemeById(settingsForPreset.custom_theme_id, userId);
    if (theme) {
      customTheme = { name: theme.name, css: theme.css };
    }
  }

  const discordWidgetSnapshot: ProfilePresetDiscordWidget | null = discordWidget
    ? {
        is_enabled: discordWidget.is_enabled,
        config: discordWidget.config,
      }
    : settingsForPreset.show_discord_status
      ? {
          is_enabled: settingsForPreset.show_discord_status,
          config: settingsForPreset.discord_card_config,
        }
      : null;

  const snapshot: ProfilePresetData = {
    version: 1 satisfies typeof PRESET_DATA_VERSION,
    profile: {
      display_name: profile?.display_name ?? "",
      bio: profile?.bio ?? "",
      avatar_url: profile?.avatar_url ?? null,
      banner_url: profile?.banner_url ?? null,
    },
    settings: extractPresetSettings(settingsForPreset),
    links: links.map((link) => ({
      title: link.title,
      url: link.url,
      icon: link.icon,
      color: link.color,
      background_color: link.background_color,
      animation: link.animation,
      is_featured: link.is_featured,
      sort_order: link.sort_order,
    })),
    embeds: embeds.map((embed) => ({
      embed_type: embed.embed_type,
      url: embed.url,
      title: embed.title,
      embed_id: embed.embed_id,
      is_visible: embed.is_visible,
      sort_order: embed.sort_order,
      config: embed.config,
    })),
    featuredBlocks: featuredBlocks.map((block) => ({
      block_type: block.block_type,
      title: block.title,
      description: block.description,
      thumbnail_url: block.thumbnail_url,
      url: block.url,
      accent_color: block.accent_color,
      is_enabled: block.is_enabled,
      sort_order: block.sort_order,
    })),
    profileBadges: profileBadges.map((badge) => ({
      badge_id: badge.id,
      is_visible: badge.is_visible,
      is_featured: badge.is_featured,
      sort_order: badge.sort_order,
    })),
    discordWidget: discordWidgetSnapshot,
    customTheme,
    featuredLinkIndex: resolveFeaturedLinkIndex(links, settingsForPreset.featured_link_id),
  };

  return options?.styleOnly ? finalizeStylePresetSnapshot(snapshot) : snapshot;
}

export function resolvePresetThumbnailUrl(data: ProfilePresetData): string | null {
  const bgImage = data.settings.background_image_url;
  if (typeof bgImage === "string" && bgImage.trim()) return bgImage;
  if (data.profile.banner_url) return data.profile.banner_url;
  if (data.profile.avatar_url) return data.profile.avatar_url;
  return null;
}

function parsePresetData(raw: unknown): ProfilePresetData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ProfilePresetData>;
  if (data.version !== 1 || !data.profile || !data.settings) return null;
  return {
    version: 1,
    profile: {
      display_name: String(data.profile.display_name ?? ""),
      bio: String(data.profile.bio ?? ""),
      avatar_url: data.profile.avatar_url ?? null,
      banner_url: data.profile.banner_url ?? null,
    },
    settings: normalizePresetBackgroundSettings(parsePresetSettingsRecord(data.settings)),
    links: Array.isArray(data.links) ? data.links : [],
    embeds: Array.isArray(data.embeds) ? data.embeds : [],
    featuredBlocks: Array.isArray(data.featuredBlocks) ? data.featuredBlocks : [],
    profileBadges: Array.isArray(data.profileBadges) ? data.profileBadges : [],
    discordWidget: data.discordWidget ?? null,
    customTheme: data.customTheme ?? null,
    featuredLinkIndex:
      typeof data.featuredLinkIndex === "number" ? data.featuredLinkIndex : null,
  };
}

async function resolveCustomThemeId(
  userId: string,
  data: ProfilePresetData,
): Promise<string | null> {
  if (!data.customTheme?.css?.trim()) return null;

  const supabase = await createClient();
  const themeName = data.customTheme.name.trim().slice(0, 60) || "Preset Theme";

  const { data: existing } = await supabase
    .from("custom_themes")
    .select("id")
    .eq("profile_id", userId)
    .eq("name", themeName)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("custom_themes")
      .update({ css: data.customTheme.css })
      .eq("id", existing.id)
      .eq("profile_id", userId);
    return existing.id;
  }

  const { count } = await supabase
    .from("custom_themes")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  const { data: created, error } = await supabase
    .from("custom_themes")
    .insert({
      profile_id: userId,
      name: themeName,
      css: data.customTheme.css,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

export async function applyProfilePresetSnapshot(
  userId: string,
  rawData: unknown,
  options?: ApplyPresetOptions,
): Promise<{ error?: string }> {
  const data = parsePresetData(rawData);
  if (!data) return { error: "Invalid preset data." };

  const supabase = await createClient();
  const preservePersonal = options?.preservePersonalContent === true;

  const { data: currentProfile } = preservePersonal
    ? await supabase
        .from("profiles")
        .select("display_name, bio")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const customThemeId = await resolveCustomThemeId(userId, data);

  const normalizedBackground = normalizePresetBackgroundSettings(data.settings);
  const settingsPatch: Record<string, unknown> = {
    ...data.settings,
    ...normalizedBackground,
    custom_theme_id: customThemeId,
  };

  if (data.discordWidget) {
    settingsPatch.show_discord_status = data.discordWidget.is_enabled;
  }

  delete settingsPatch.discord_card_config;
  delete settingsPatch.discord_card_style;
  delete settingsPatch.discord_show_lanyard_hint;
  delete settingsPatch.active_preset_id;

  const safeSettingsPatch = await omitUnsupportedSettingsColumns(settingsPatch);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: preservePersonal
        ? (currentProfile?.display_name ?? data.profile.display_name)
        : data.profile.display_name,
      bio: preservePersonal ? (currentProfile?.bio ?? data.profile.bio) : data.profile.bio,
      avatar_url: data.profile.avatar_url,
      banner_url: data.profile.banner_url,
    })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  const { error: settingsError } = await supabase
    .from("profile_settings")
    .update(safeSettingsPatch)
    .eq("profile_id", userId);

  if (settingsError) return { error: formatSchemaError(settingsError.message) };

  if (!preservePersonal) {
    await supabase.from("links").delete().eq("profile_id", userId);

    let featuredLinkId: string | null = null;
    const sortedLinks = [...data.links].sort((a, b) => a.sort_order - b.sort_order);
    if (sortedLinks.length > 0) {
      const { data: insertedLinks, error: linksError } = await supabase
        .from("links")
        .insert(
          sortedLinks.map((link, index) => ({
            profile_id: userId,
            title: link.title,
            url: link.url,
            icon: link.icon,
            color: link.color,
            background_color: link.background_color,
            animation: link.animation,
            is_featured: link.is_featured,
            sort_order: index,
          })),
        )
        .select("id");

      if (linksError) return { error: formatSchemaError(linksError.message) };

      if (
        insertedLinks &&
        data.featuredLinkIndex != null &&
        data.featuredLinkIndex >= 0 &&
        data.featuredLinkIndex < insertedLinks.length
      ) {
        featuredLinkId = insertedLinks[data.featuredLinkIndex].id as string;
      } else {
        const featuredIndex = sortedLinks.findIndex((link) => link.is_featured);
        featuredLinkId =
          featuredIndex >= 0 && insertedLinks?.[featuredIndex]
            ? (insertedLinks[featuredIndex].id as string)
            : null;
      }

      if (featuredLinkId) {
        await supabase
          .from("profile_settings")
          .update({ featured_link_id: featuredLinkId })
          .eq("profile_id", userId);
      }
    } else {
      await supabase
        .from("profile_settings")
        .update({ featured_link_id: null })
        .eq("profile_id", userId);
    }
  }

  await supabase.from("profile_embeds").delete().eq("profile_id", userId);
  if (data.embeds.length > 0) {
    const { error: embedsError } = await supabase.from("profile_embeds").insert(
      data.embeds.map((embed) => ({
        profile_id: userId,
        embed_type: embed.embed_type,
        url: embed.url,
        title: embed.title,
        embed_id: embed.embed_id,
        is_visible: embed.is_visible,
        sort_order: embed.sort_order,
        config: embed.config,
      })),
    );
    if (embedsError) return { error: embedsError.message };
  }

  await supabase.from("featured_blocks").delete().eq("profile_id", userId);
  if (data.featuredBlocks.length > 0) {
    const { error: featuredError } = await supabase.from("featured_blocks").insert(
      data.featuredBlocks.map((block) => ({
        profile_id: userId,
        block_type: block.block_type,
        title: block.title,
        description: block.description,
        thumbnail_url: block.thumbnail_url,
        url: block.url,
        accent_color: block.accent_color,
        is_enabled: block.is_enabled,
        sort_order: block.sort_order,
      })),
    );
    if (featuredError) return { error: featuredError.message };
  }

  if (!preservePersonal) {
    for (const badge of data.profileBadges) {
      await supabase
        .from("profile_badges")
        .update({
          is_visible: badge.is_visible,
          is_featured: badge.is_featured,
          sort_order: badge.sort_order,
        })
        .eq("profile_id", userId)
        .eq("badge_id", badge.badge_id);
    }
  }

  if (data.discordWidget) {
    await supabase.from("profile_widgets").upsert(
      {
        profile_id: userId,
        widget_type: "discord_status",
        is_enabled: data.discordWidget.is_enabled,
        config: data.discordWidget.config,
      },
      { onConflict: "profile_id,widget_type" },
    );
  }

  return {};
}

export { parsePresetData };
