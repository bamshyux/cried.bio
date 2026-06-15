"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { DEFAULT_CUSTOM_THEME_CSS } from "@/lib/themes/default-template";
import { scopeProfileCss } from "@/lib/themes/scope-css";
import { validateCssInput } from "@/lib/themes/sanitize-css";
import type { CustomThemeFormState } from "@/lib/types/custom-theme";
import { MAX_CUSTOM_THEMES } from "@/lib/types/custom-theme";
import { createClient } from "@/lib/supabase/server";

const REVALIDATE_PATHS = ["/dashboard/custom-theme", "/dashboard/themes"];

function validateThemeCss(css: string) {
  const validated = validateCssInput(css);
  if (!validated.ok) return validated;

  const scoped = scopeProfileCss(validated.css);
  if (scoped.errors.length > 0 && !scoped.css) {
    return { ok: false as const, error: scoped.errors[0] ?? "Invalid CSS." };
  }

  return { ok: true as const, css: validated.css };
}

export async function createCustomThemeAction(
  name: string,
  css?: string,
): Promise<CustomThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const themeName = name.trim().slice(0, 60) || "My Theme";
  const nameError = await rejectIfModerated(themeName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const themeCss = css ?? DEFAULT_CUSTOM_THEME_CSS;
  const check = validateThemeCss(themeCss);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { count } = await supabase
    .from("custom_themes")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  if ((count ?? 0) >= MAX_CUSTOM_THEMES) {
    return { error: `Maximum ${MAX_CUSTOM_THEMES} custom themes allowed.` };
  }

  const { data, error } = await supabase
    .from("custom_themes")
    .insert({
      profile_id: userId,
      name: themeName,
      css: check.css,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  return { success: "Theme created.", themeId: data.id };
}

export async function saveCustomThemeAction(
  themeId: string,
  name: string,
  css: string,
): Promise<CustomThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const check = validateThemeCss(css);
  if (!check.ok) return { error: check.error };

  const themeName = name.trim().slice(0, 60) || "My Theme";
  const nameError = await rejectIfModerated(themeName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_themes")
    .update({
      name: themeName,
      css: check.css,
    })
    .eq("id", themeId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  return { success: "Theme saved." };
}

export async function duplicateCustomThemeAction(themeId: string): Promise<CustomThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: source, error: fetchError } = await supabase
    .from("custom_themes")
    .select("*")
    .eq("id", themeId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (fetchError || !source) return { error: "Theme not found." };

  const { count } = await supabase
    .from("custom_themes")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  if ((count ?? 0) >= MAX_CUSTOM_THEMES) {
    return { error: `Maximum ${MAX_CUSTOM_THEMES} custom themes allowed.` };
  }

  const copyName = `${source.name} (copy)`.slice(0, 60);
  const nameError = await rejectIfModerated(copyName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const { data, error } = await supabase
    .from("custom_themes")
    .insert({
      profile_id: userId,
      name: copyName,
      css: source.css,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  return { success: "Theme duplicated.", themeId: data.id };
}

export async function deleteCustomThemeAction(themeId: string): Promise<CustomThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();

  await supabase
    .from("profile_settings")
    .update({ custom_theme_id: null })
    .eq("profile_id", userId)
    .eq("custom_theme_id", themeId);

  const { error } = await supabase
    .from("custom_themes")
    .delete()
    .eq("id", themeId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  return { success: "Theme deleted." };
}

export async function applyCustomThemeAction(themeId: string): Promise<CustomThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: theme } = await supabase
    .from("custom_themes")
    .select("id")
    .eq("id", themeId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (!theme) return { error: "Theme not found." };

  const { error } = await supabase
    .from("profile_settings")
    .update({ layout: "custom", custom_theme_id: themeId })
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  return { success: "Custom theme applied to your profile." };
}

export async function ensureDefaultCustomTheme(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("custom_themes")
    .select("id")
    .eq("profile_id", userId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const result = await createCustomThemeAction("My Theme");
  return result.themeId ?? null;
}
