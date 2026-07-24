"use server";

import { createClient } from "@/lib/supabase/server";
import { clampCardLayout, mergeSettings, parseCursorEffect, parseTabTitleAnimation, parseUsernameEffect } from "@/lib/settings";
import { clampLinksIconSize } from "@/lib/links";
import {
  clampLinksBorderRadius,
  clampLinksButtonOpacity,
  parseLinksButtonStyle,
  parseLinksSpacing,
} from "@/lib/settings";
import { clampCursorImageSize } from "@/lib/profile/custom-cursor";
import { isValidProfileFaviconStorageUrl } from "@/lib/profile/favicon";
import { backgroundUploadSizeError, MAX_BACKGROUND_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { formatSchemaError } from "@/lib/db/schema";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import { markProfileAppearanceChanged } from "@/lib/data/profile-presets";
import { rejectIfModerated } from "@/lib/moderation/validate";
import type { SettingsFormState, SettingsSection } from "@/lib/types/settings";
import type { CardBorderEffectPreset } from "@/lib/types/settings";
import { parseCardBorderTargets, writeContentPageBorderTargets } from "@/lib/card-border-effects/resolve";
import { CARD_BORDER_EFFECT_OPTIONS } from "@/lib/card-border-effects/presets";
import { sanitizeCardBorderEffectSelection } from "@/lib/card-border-effects/premium";
import { sanitizeProfileLayoutSelection } from "@/lib/premium/layout-settings";
import type {
  BackgroundType,
  EnterGateAnimation,
  EnterGateBackgroundType,
  EnterGateButtonStyle,
  EnterGateTextAlign,
  LinkAnimation,
  ParticleEffect,
  ProfileLayout,
  ProfileSettings,
} from "@/lib/types/settings";
import { revalidatePath } from "next/cache";
import { revalidateProfileOg } from "@/lib/og/revalidate";
import { isPremiumFont } from "@/lib/premium/fonts";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { ensureProfileSettingsRow, PAGE_SETTINGS_MIGRATION_HINT } from "@/lib/data/ensure-profile-settings-row";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function revalidateProfile(userId: string, pageId?: string | null) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard/customize");
  revalidatePath("/dashboard/background");
  revalidatePath("/dashboard/music");
  revalidatePath("/dashboard/effects");
  revalidatePath("/dashboard/card-border-effects");
  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard/custom-theme");
  revalidatePath("/dashboard/profile-presets");
  revalidatePath("/dashboard/links");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/guestbook");
  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/profile-pages");

  if (pageId) {
    revalidatePath(`/dashboard/pages/${pageId}`, "layout");
    if (profile?.username) {
      const { getProfilePageById } = await import("@/lib/data/profile-pages");
      const page = await getProfilePageById(userId, pageId);
      if (page?.slug) revalidatePath(`/${profile.username}/${page.slug}`);
    }
    return;
  }

  if (profile?.username) {
    revalidatePath(`/${profile.username}`);
    revalidateProfileOg(profile.username);
  }
}

async function getExistingSettings(userId: string, pageId?: string | null): Promise<ProfileSettings> {
  const supabase = await createClient();
  let query = supabase.from("profile_settings").select("*").eq("profile_id", userId);
  query = pageId ? query.eq("page_id", pageId) : query.is("page_id", null);
  const { data } = await query.maybeSingle();
  return mergeSettings(data as Partial<ProfileSettings> | null, userId);
}

async function ensureSettingsRow(userId: string, pageId?: string | null) {
  return ensureProfileSettingsRow(userId, pageId);
}

async function patchProfileSettings(
  userId: string,
  patch: Partial<Omit<ProfileSettings, "profile_id" | "created_at" | "updated_at">>,
  pageId?: string | null,
): Promise<{ error?: string }> {
  const safePatch = await omitUnsupportedSettingsColumns(patch);
  if (Object.keys(safePatch).length === 0) {
    return { error: "No settings to save." };
  }

  const supabase = await createClient();
  const updatedAt = new Date().toISOString();

  if (pageId) {
    const ensure = await ensureSettingsRow(userId, pageId);
    if (ensure.error) return ensure;

    const { data, error } = await supabase
      .from("profile_settings")
      .update({ ...safePatch, updated_at: updatedAt })
      .eq("profile_id", userId)
      .eq("page_id", pageId)
      .select("id");

    if (error) return { error: formatSchemaError(error.message) };
    if (!data?.length) {
      return { error: PAGE_SETTINGS_MIGRATION_HINT };
    }
    return {};
  }

  let query = supabase
    .from("profile_settings")
    .update({ ...safePatch, updated_at: updatedAt })
    .eq("profile_id", userId)
    .is("page_id", null);
  const { data, error } = await query.select("id");

  if (error) return { error: formatSchemaError(error.message) };
  if (!data?.length) {
    const ensure = await ensureSettingsRow(userId, null);
    if (ensure.error) return ensure;
    const retry = await supabase
      .from("profile_settings")
      .update({ ...safePatch, updated_at: updatedAt })
      .eq("profile_id", userId)
      .is("page_id", null)
      .select("id");
    if (retry.error) return { error: formatSchemaError(retry.error.message) };
    if (!retry.data?.length) return { error: "Could not save profile settings." };
  }

  await markProfileAppearanceChanged(userId);
  return {};
}

function parseBool(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseIntField(value: FormDataEntryValue | null, fallback: number) {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseGradient(raw: string, fallback: string[]) {
  if (!raw.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return raw.split(",").map((c) => c.trim()).filter(Boolean);
}

function parseEnterGateBackgroundType(value: string, fallback: EnterGateBackgroundType): EnterGateBackgroundType {
  const allowed: EnterGateBackgroundType[] = ["solid", "image", "video", "gradient", "profile"];
  return allowed.includes(value as EnterGateBackgroundType) ? (value as EnterGateBackgroundType) : fallback;
}

function parseEnterGateTextAlign(value: string, fallback: EnterGateTextAlign): EnterGateTextAlign {
  return (["left", "center", "right"].includes(value) ? value : fallback) as EnterGateTextAlign;
}

function parseEnterGateButtonStyle(value: string, fallback: EnterGateButtonStyle): EnterGateButtonStyle {
  const allowed: EnterGateButtonStyle[] = ["pill", "outline", "ghost", "minimal", "glow"];
  return allowed.includes(value as EnterGateButtonStyle) ? (value as EnterGateButtonStyle) : fallback;
}

function parseEnterGateAnimation(value: string, fallback: EnterGateAnimation): EnterGateAnimation {
  const allowed: EnterGateAnimation[] = ["none", "pulse", "fade", "bounce", "glow"];
  return allowed.includes(value as EnterGateAnimation) ? (value as EnterGateAnimation) : fallback;
}

function clampEnterGate(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseParticle(value: string): ParticleEffect | null {
  const v = value.trim();
  if (!v) return null;
  return v as ParticleEffect;
}

function parseCardBorderEffect(value: string, fallback: CardBorderEffectPreset): CardBorderEffectPreset {
  const allowed = CARD_BORDER_EFFECT_OPTIONS.map((option) => option.value);
  return allowed.includes(value as CardBorderEffectPreset)
    ? (value as CardBorderEffectPreset)
    : fallback;
}

function clampCardBorder(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseSectionUpdates(
  section: SettingsSection,
  formData: FormData,
  existing: ProfileSettings,
): Partial<ProfileSettings> {
  switch (section) {
    case "customize":
      return {
        accent_color: String(formData.get("accent_color") ?? existing.accent_color),
        text_color: String(formData.get("text_color") ?? existing.text_color),
        font_family: String(formData.get("font_family") ?? existing.font_family),
        glassmorphism: parseBool(formData.get("glassmorphism")),
        neon_glow: parseBool(formData.get("neon_glow")),
        border_radius: parseIntField(formData.get("border_radius"), existing.border_radius),
        profile_opacity: parseIntField(formData.get("profile_opacity"), existing.profile_opacity),
        profile_blur: parseIntField(formData.get("profile_blur"), existing.profile_blur),
        profile_status: String(formData.get("profile_status") ?? existing.profile_status),
        profile_status_color: parseBool(formData.get("profile_status_use_accent"))
          ? ""
          : String(formData.get("profile_status_color") ?? existing.profile_status_color),
        show_view_count: parseBool(formData.get("show_view_count")),
        show_join_date: parseBool(formData.get("show_join_date")),
        profile_parallax: parseBool(formData.get("profile_parallax")),
        content_alignment: (["left", "center", "right"].includes(String(formData.get("content_alignment")))
          ? String(formData.get("content_alignment"))
          : existing.content_alignment) as import("@/lib/types/settings").ContentAlignment,
        layout_label: String(formData.get("layout_label") ?? existing.layout_label).slice(0, 64),
        hide_card_border: parseBool(formData.get("hide_card_border")),
        card_border_effect: parseCardBorderEffect(
          String(formData.get("card_border_effect") ?? existing.card_border_effect),
          existing.card_border_effect,
        ),
        ...(formData.has("border_content_card") || formData.has("border_links")
          ? writeContentPageBorderTargets(
              parseBool(formData.get("border_content_card")),
              parseBool(formData.get("border_links")),
            )
          : {}),
      };
    case "card_border":
      return {
        card_border_effect: parseCardBorderEffect(
          String(formData.get("card_border_effect") ?? existing.card_border_effect),
          existing.card_border_effect,
        ),
        card_border_thickness: clampCardBorder(
          parseIntField(formData.get("card_border_thickness"), existing.card_border_thickness),
          1,
          12,
          existing.card_border_thickness,
        ),
        card_border_speed: clampCardBorder(
          parseIntField(formData.get("card_border_speed"), existing.card_border_speed),
          25,
          300,
          existing.card_border_speed,
        ),
        card_border_glow_intensity: clampCardBorder(
          parseIntField(formData.get("card_border_glow_intensity"), existing.card_border_glow_intensity),
          0,
          100,
          existing.card_border_glow_intensity,
        ),
        card_border_color: String(formData.get("card_border_color") ?? existing.card_border_color).slice(0, 32),
        card_border_secondary_color: String(
          formData.get("card_border_secondary_color") ?? existing.card_border_secondary_color,
        ).slice(0, 32),
        card_border_apply_all: parseBool(formData.get("card_border_apply_all")),
        card_border_targets: parseCardBorderTargets(
          formData.get("card_border_targets") ?? existing.card_border_targets,
        ),
      };
    case "links":
      return {
        links_monochrome: parseBool(formData.get("links_monochrome")),
        links_style: String(formData.get("links_style") ?? existing.links_style) as import("@/lib/types/settings").LinksStyle,
        links_icon_size: clampLinksIconSize(
          parseIntField(formData.get("links_icon_size"), existing.links_icon_size),
        ),
        links_icon_glow: parseBool(formData.get("links_icon_glow")),
        links_icon_shadow: parseBool(formData.get("links_icon_shadow")),
        links_icon_pulse: parseBool(formData.get("links_icon_pulse")),
        links_spacing: parseLinksSpacing(String(formData.get("links_spacing") ?? existing.links_spacing)),
        links_button_style: parseLinksButtonStyle(
          String(formData.get("links_button_style") ?? existing.links_button_style),
        ),
        links_border_radius: clampLinksBorderRadius(
          parseIntField(formData.get("links_border_radius"), existing.links_border_radius),
        ),
        links_button_opacity: clampLinksButtonOpacity(
          parseIntField(formData.get("links_button_opacity"), existing.links_button_opacity),
        ),
        links_show_hostname: parseBool(formData.get("links_show_hostname")),
        link_animation: String(formData.get("link_animation") ?? existing.link_animation) as LinkAnimation,
      };
    case "background":
      return {
        background_type: String(formData.get("background_type") ?? existing.background_type) as BackgroundType,
        background_color: String(formData.get("background_color") ?? existing.background_color),
        gradient_colors: parseGradient(
          String(formData.get("gradient_colors") ?? ""),
          existing.gradient_colors,
        ),
        animated_gradient: parseBool(formData.get("animated_gradient")),
        particle_effect: parseParticle(String(formData.get("particle_effect") ?? "")),
        overlay_opacity: parseIntField(formData.get("overlay_opacity"), existing.overlay_opacity),
        vignette: parseBool(formData.get("vignette")),
        noise_texture: parseBool(formData.get("noise_texture")),
      };
    case "themes": {
      const layout = String(formData.get("layout") ?? existing.layout) as ProfileLayout;
      const customThemeId = String(formData.get("custom_theme_id") ?? "").trim();
      return {
        layout,
        ...(layout === "custom" && customThemeId ? { custom_theme_id: customThemeId } : {}),
      };
    }
    case "music":
      return {
        music_title: String(formData.get("music_title") ?? existing.music_title).trim(),
        music_autoplay: parseBool(formData.get("music_autoplay")),
        music_loop: parseBool(formData.get("music_loop")),
        music_show_player:
          formData.get("music_show_player") == null || String(formData.get("music_show_player")) === ""
            ? existing.music_show_player !== false
            : parseBool(formData.get("music_show_player")),
        music_volume: parseIntField(formData.get("music_volume"), existing.music_volume),
        music_player_color: parseBool(formData.get("music_use_accent"))
          ? ""
          : String(formData.get("music_player_color") ?? existing.music_player_color),
      };
    case "effects":
      return {
        cursor_effect: parseCursorEffect(formData.get("cursor_effect"), existing.cursor_effect),
        cursor_image_size: clampCursorImageSize(
          formData.get("cursor_image_size"),
          existing.cursor_image_size,
        ),
        typing_bio: parseBool(formData.get("typing_bio")),
        username_effect: parseUsernameEffect(formData.get("username_effect"), existing.username_effect),
        hover_animations: parseBool(formData.get("hover_animations")),
        page_entrance: parseBool(formData.get("page_entrance")),
        tab_title_animation: parseTabTitleAnimation(
          formData.get("tab_title_animation"),
          existing.tab_title_animation,
        ),
        enter_gate_title: String(formData.get("enter_gate_title") ?? existing.enter_gate_title).trim().slice(0, 80),
        enter_gate_subtitle: String(formData.get("enter_gate_subtitle") ?? existing.enter_gate_subtitle).trim().slice(0, 200),
        enter_gate_button: String(formData.get("enter_gate_button") ?? existing.enter_gate_button).trim().slice(0, 40),
        enter_gate_show_avatar: parseBool(formData.get("enter_gate_show_avatar")),
        enter_gate_show_username: parseBool(formData.get("enter_gate_show_username")),
        enter_gate_show_branding: parseBool(formData.get("enter_gate_show_branding")),
        enter_gate_blur: parseBool(formData.get("enter_gate_blur")),
        enter_gate_blur_strength: clampEnterGate(
          parseIntField(formData.get("enter_gate_blur_strength"), existing.enter_gate_blur_strength),
          0,
          30,
          existing.enter_gate_blur_strength,
        ),
        enter_gate_background_type: parseEnterGateBackgroundType(
          String(formData.get("enter_gate_background_type") ?? existing.enter_gate_background_type),
          existing.enter_gate_background_type,
        ),
        enter_gate_background_color: String(formData.get("enter_gate_background_color") ?? existing.enter_gate_background_color),
        enter_gate_gradient_colors: parseGradient(
          String(formData.get("enter_gate_gradient_colors") ?? ""),
          existing.enter_gate_gradient_colors,
        ),
        enter_gate_animated_gradient: parseBool(formData.get("enter_gate_animated_gradient")),
        enter_gate_overlay_opacity: clampEnterGate(
          parseIntField(formData.get("enter_gate_overlay_opacity"), existing.enter_gate_overlay_opacity),
          0,
          100,
          existing.enter_gate_overlay_opacity,
        ),
        enter_gate_vignette: parseBool(formData.get("enter_gate_vignette")),
        enter_gate_noise: parseBool(formData.get("enter_gate_noise")),
        enter_gate_particle_effect: parseParticle(String(formData.get("enter_gate_particle_effect") ?? "")),
        enter_gate_title_color: String(formData.get("enter_gate_title_color") ?? existing.enter_gate_title_color).slice(0, 32),
        enter_gate_subtitle_color: String(formData.get("enter_gate_subtitle_color") ?? existing.enter_gate_subtitle_color).slice(0, 32),
        enter_gate_accent_color: String(formData.get("enter_gate_accent_color") ?? existing.enter_gate_accent_color).slice(0, 32),
        enter_gate_text_align: parseEnterGateTextAlign(
          String(formData.get("enter_gate_text_align") ?? existing.enter_gate_text_align),
          existing.enter_gate_text_align,
        ),
        enter_gate_button_style: parseEnterGateButtonStyle(
          String(formData.get("enter_gate_button_style") ?? existing.enter_gate_button_style),
          existing.enter_gate_button_style,
        ),
        enter_gate_animation: parseEnterGateAnimation(
          String(formData.get("enter_gate_animation") ?? existing.enter_gate_animation),
          existing.enter_gate_animation,
        ),
        enter_gate_glass_card: parseBool(formData.get("enter_gate_glass_card")),
        enter_gate_card_opacity: clampEnterGate(
          parseIntField(formData.get("enter_gate_card_opacity"), existing.enter_gate_card_opacity),
          0,
          100,
          existing.enter_gate_card_opacity,
        ),
        enter_gate_font_family: String(
          formData.get("enter_gate_font_family") ?? existing.enter_gate_font_family,
        ).slice(0, 32),
      };
    case "profile": {
      const fontWeight = parseIntField(formData.get("bio_font_weight"), existing.bio_font_weight);
      const allowedWeights = [400, 500, 600, 700];
      const letterSpacing = String(formData.get("bio_letter_spacing") ?? existing.bio_letter_spacing);
      return {
        bio_color: String(formData.get("bio_color") ?? existing.bio_color).slice(0, 32),
        bio_font_family: String(formData.get("bio_font_family") ?? existing.bio_font_family).slice(0, 32),
        bio_font_size: clampEnterGate(
          parseIntField(formData.get("bio_font_size"), existing.bio_font_size),
          12,
          32,
          existing.bio_font_size,
        ),
        bio_font_weight: allowedWeights.includes(fontWeight) ? fontWeight : existing.bio_font_weight,
        bio_italic: parseBool(formData.get("bio_italic")),
        bio_glow: parseBool(formData.get("bio_glow")),
        bio_letter_spacing: (["normal", "wide", "wider"].includes(letterSpacing)
          ? letterSpacing
          : existing.bio_letter_spacing) as import("@/lib/types/settings").BioLetterSpacing,
      };
    }
    case "guestbook": {
      const updates: Partial<ProfileSettings> = {};

      if (formData.has("guestbook_enabled")) {
        updates.guestbook_enabled = parseBool(formData.get("guestbook_enabled"));
      }
      if (formData.has("guestbook_approval_required")) {
        updates.guestbook_approval_required = parseBool(formData.get("guestbook_approval_required"));
      }
      if (formData.has("guestbook_use_profile_card")) {
        updates.guestbook_use_profile_card = parseBool(formData.get("guestbook_use_profile_card"));
      }
      if (formData.has("guestbook_opacity")) {
        updates.guestbook_opacity = clampEnterGate(
          parseIntField(formData.get("guestbook_opacity"), existing.guestbook_opacity),
          0,
          100,
          existing.guestbook_opacity,
        );
      }
      if (formData.has("guestbook_blur")) {
        updates.guestbook_blur = clampEnterGate(
          parseIntField(formData.get("guestbook_blur"), existing.guestbook_blur),
          0,
          30,
          existing.guestbook_blur,
        );
      }
      if (formData.has("guestbook_glassmorphism")) {
        updates.guestbook_glassmorphism = parseBool(formData.get("guestbook_glassmorphism"));
      }
      if (formData.has("guestbook_show_background")) {
        updates.guestbook_show_background = parseBool(formData.get("guestbook_show_background"));
      }
      if (formData.has("guestbook_background_color")) {
        updates.guestbook_background_color = String(formData.get("guestbook_background_color")).slice(0, 32);
      }
      if (formData.has("guestbook_message_opacity")) {
        updates.guestbook_message_opacity = clampEnterGate(
          parseIntField(formData.get("guestbook_message_opacity"), existing.guestbook_message_opacity),
          10,
          100,
          existing.guestbook_message_opacity,
        );
      }
      if (formData.has("guestbook_author_opacity")) {
        updates.guestbook_author_opacity = clampEnterGate(
          parseIntField(formData.get("guestbook_author_opacity"), existing.guestbook_author_opacity),
          10,
          100,
          existing.guestbook_author_opacity,
        );
      }
      if (formData.has("guestbook_label_opacity")) {
        updates.guestbook_label_opacity = clampEnterGate(
          parseIntField(formData.get("guestbook_label_opacity"), existing.guestbook_label_opacity),
          10,
          100,
          existing.guestbook_label_opacity,
        );
      }
      if (formData.has("guestbook_text_color")) {
        updates.guestbook_text_color = String(formData.get("guestbook_text_color")).slice(0, 32);
      }
      if (formData.has("guestbook_border_style")) {
        const borderStyle = String(formData.get("guestbook_border_style"));
        updates.guestbook_border_style = (["none", "accent-left", "subtle-full"].includes(borderStyle)
          ? borderStyle
          : existing.guestbook_border_style) as import("@/lib/types/settings").GuestbookBorderStyle;
      }
      if (formData.has("guestbook_spacing")) {
        const spacing = String(formData.get("guestbook_spacing"));
        updates.guestbook_spacing = (["compact", "default", "relaxed"].includes(spacing)
          ? spacing
          : existing.guestbook_spacing) as import("@/lib/types/settings").GuestbookSpacing;
      }
      if (formData.has("guestbook_padding_y")) {
        updates.guestbook_padding_y = clampEnterGate(
          parseIntField(formData.get("guestbook_padding_y"), existing.guestbook_padding_y),
          8,
          48,
          existing.guestbook_padding_y,
        );
      }

      return updates;
    }
    default:
      return {};
  }
}

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const section = String(formData.get("_section") ?? "") as SettingsSection;
  if (!section) return { error: "Invalid settings section." };

  const pageIdRaw = String(formData.get("_page_id") ?? "").trim();
  const pageId = pageIdRaw || null;

  if (pageId) {
    const { requireEntitlement } = await import("@/lib/premium/entitlements");
    const { getProfilePageById } = await import("@/lib/data/profile-pages");
    const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
    if (!gate.ok) return { error: gate.error };
    const page = await getProfilePageById(userId, pageId);
    if (!page) return { error: "Profile page not found." };
  }

  const ensure = await ensureSettingsRow(userId, pageId);
  if (ensure.error) return { error: ensure.error };

  const existing = await getExistingSettings(userId, pageId);
  const updates = parseSectionUpdates(section, formData, existing);

  if (section === "customize" && updates.font_family && isPremiumFont(String(updates.font_family))) {
    const entitlements = await getUserEntitlements(userId);
    if (!entitlements.can_use_premium_fonts) {
      return { error: "Premium Lite is required for this font." };
    }
  }

  if (section === "music") {
    const entitlements = await getUserEntitlements(userId);
    if (!entitlements.can_use_playlist) {
      updates.music_show_player = true;
    }
  }

  if (
    (section === "card_border" || section === "customize") &&
    updates.card_border_effect
  ) {
    const entitlements = await getUserEntitlements(userId);
    updates.card_border_effect = sanitizeCardBorderEffectSelection(
      updates.card_border_effect,
      entitlements.animated_effects,
    );
  }

  if (section === "themes" && updates.layout) {
    const entitlements = await getUserEntitlements(userId);
    updates.layout = sanitizeProfileLayoutSelection(
      updates.layout,
      entitlements.animated_effects,
    );
  }

  if (section === "customize" && updates.layout_label) {
    const layoutLabelError = await rejectIfModerated(
      updates.layout_label,
      "layout_label",
      userId,
    );
    if (layoutLabelError) return { error: layoutLabelError };
  }

  const { error } = await patchProfileSettings(userId, updates, pageId);
  if (error) return { error };

  await revalidateProfile(userId, pageId);

  const messages: Partial<Record<SettingsSection, string>> = {
    customize: "Customization saved.",
    links: "Link settings saved.",
    background: "Background saved.",
    themes: "Theme saved.",
    music: "Music settings saved.",
    effects: "Effects saved.",
    card_border: "Card border effects saved.",
    profile: "Bio styling saved.",
    guestbook: "Guestbook settings saved.",
    social: "Social settings saved.",
  };

  return { success: messages[section] ?? "Settings saved." };
}

export async function updateCardLayoutAction(layout: {
  card_offset_x: number;
  card_offset_y: number;
  card_width: number;
  card_max_height: number;
}): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  await ensureSettingsRow(userId);
  const patch = clampCardLayout(layout);

  const { error } = await patchProfileSettings(userId, patch);
  if (error) return { error };

  await revalidateProfile(userId);
  return { success: "Card layout saved." };
}

const MAX_MUSIC_SIZE = 20 * 1024 * 1024;

async function uploadFile(
  userId: string,
  file: File,
  bucket: "backgrounds" | "music",
  filename: string,
) {
  const supabase = await createClient();
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${publicUrl}?v=${Date.now()}`;
}

async function deleteStoragePrefix(
  userId: string,
  bucket: "backgrounds" | "music" | "profiles",
  namePrefix: string,
) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(bucket).list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((f) => f.name.startsWith(namePrefix))
    .map((f) => `${userId}/${f.name}`);

  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

export async function saveBackgroundMediaAction(
  mediaUrl: string,
  mediaType: "image" | "video",
  pageId?: string | null,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!mediaUrl.trim()) return { error: "Invalid background URL." };

  const ensure = await ensureSettingsRow(userId, pageId);
  if (ensure.error) return { error: ensure.error };

  const update =
    mediaType === "video"
      ? { background_type: "video" as const, background_video_url: mediaUrl, background_image_url: null }
      : { background_type: "image" as const, background_image_url: mediaUrl, background_video_url: null };

  const { error } = await patchProfileSettings(userId, update, pageId);
  if (error) return { error };

  await revalidateProfile(userId, pageId);
  return {
    success: mediaType === "video" ? "Video background uploaded." : "Image background uploaded.",
  };
}

export async function saveMusicAction(
  musicUrl: string,
  pageId?: string | null,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!musicUrl.trim()) return { error: "Invalid music URL." };

  const ensure = await ensureSettingsRow(userId, pageId);
  if (ensure.error) return { error: ensure.error };

  const { error } = await patchProfileSettings(userId, { music_url: musicUrl }, pageId);
  if (error) return { error };

  await revalidateProfile(userId, pageId);
  return { success: "Music uploaded." };
}

export async function uploadBackgroundAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const file = formData.get("background");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a file." };
  }

  if (file.size > MAX_BACKGROUND_UPLOAD_BYTES) {
    return { error: backgroundUploadSizeError(file.size) };
  }

  await ensureSettingsRow(userId);

  const isVideo = file.type === "video/mp4";
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    return { error: "Upload a JPEG, PNG, WebP, GIF, or MP4 file." };
  }

  try {
    const ext = isVideo ? "mp4" : file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    await deleteStoragePrefix(userId, "backgrounds", "background.");
    const url = await uploadFile(userId, file, "backgrounds", `background.${ext}`);
    return saveBackgroundMediaAction(url, isVideo ? "video" : "image");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function uploadMusicAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const file = formData.get("music");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select an audio file." };
  }

  if (file.size > MAX_MUSIC_SIZE) return { error: "Audio must be 20 MB or smaller." };
  if (!file.type.startsWith("audio/")) return { error: "Upload MP3, WAV, OGG, or WebM audio." };

  await ensureSettingsRow(userId);

  try {
    const ext = file.type.split("/")[1]?.replace("mpeg", "mp3") ?? "mp3";
    const url = await uploadFile(userId, file, "music", `track.${ext}`);

    const { error } = await patchProfileSettings(userId, { music_url: url });
    if (error) return { error };

    await revalidateProfile(userId);
    return { success: "Music uploaded." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function saveEnterGateMediaAction(
  mediaUrl: string,
  mediaType: "image" | "video",
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!mediaUrl.trim()) return { error: "Invalid enter gate background URL." };

  await ensureSettingsRow(userId);

  const update =
    mediaType === "video"
      ? {
          enter_gate_background_type: "video" as const,
          enter_gate_background_video_url: mediaUrl,
          enter_gate_background_image_url: null,
        }
      : {
          enter_gate_background_type: "image" as const,
          enter_gate_background_image_url: mediaUrl,
          enter_gate_background_video_url: null,
        };

  const { error } = await patchProfileSettings(userId, update);
  if (error) return { error };

  await revalidateProfile(userId);
  return {
    success: mediaType === "video" ? "Enter gate video uploaded." : "Enter gate image uploaded.",
  };
}

export async function removeEnterGateMediaAction(): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, {
    enter_gate_background_image_url: null,
    enter_gate_background_video_url: null,
  });

  if (error) return { error };

  await deleteStoragePrefix(userId, "backgrounds", "enter-gate.");

  await revalidateProfile(userId);
  return { success: "Enter gate background removed." };
}

export async function removeBackgroundAction(pageId?: string | null): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(
    userId,
    {
      background_image_url: null,
      background_video_url: null,
    },
    pageId,
  );

  if (error) return { error };

  await deleteStoragePrefix(userId, "backgrounds", "background.");

  await revalidateProfile(userId, pageId);
  return { success: "Background removed." };
}

export async function removeMusicAction(pageId?: string | null): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, { music_url: null }, pageId);
  if (error) return { error };

  await deleteStoragePrefix(userId, "music", "track.");

  await revalidateProfile(userId, pageId);
  return { success: "Music removed." };
}

export async function saveCursorImageAction(
  imageUrl: string,
  pageId?: string | null,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!imageUrl.trim()) return { error: "Invalid cursor image URL." };

  const ensure = await ensureSettingsRow(userId, pageId);
  if (ensure.error) return { error: ensure.error };

  const { error } = await patchProfileSettings(userId, { cursor_image_url: imageUrl }, pageId);
  if (error) return { error };

  await revalidateProfile(userId, pageId);
  return { success: "Custom cursor uploaded." };
}

export async function removeCursorImageAction(pageId?: string | null): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, { cursor_image_url: null }, pageId);
  if (error) return { error };

  await deleteStoragePrefix(userId, "profiles", "cursor.");

  await revalidateProfile(userId, pageId);
  return { success: "Custom cursor removed." };
}

export async function saveProfileFaviconAction(
  imageUrl: string,
  pageId?: string | null,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!imageUrl.trim()) return { error: "Invalid favicon URL." };
  if (!isValidProfileFaviconStorageUrl(imageUrl)) {
    return { error: "Invalid favicon URL." };
  }

  const ensure = await ensureSettingsRow(userId, pageId);
  if (ensure.error) return { error: ensure.error };

  const { error } = await patchProfileSettings(userId, { profile_favicon_url: imageUrl }, pageId);
  if (error) return { error };

  await revalidateProfile(userId, pageId);
  return { success: "Profile favicon uploaded." };
}

export async function removeProfileFaviconAction(pageId?: string | null): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, { profile_favicon_url: null }, pageId);
  if (error) return { error };

  await deleteStoragePrefix(userId, "profiles", "favicon.");

  await revalidateProfile(userId, pageId);
  return { success: "Profile favicon removed." };
}
