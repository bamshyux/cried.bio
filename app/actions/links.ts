"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeLinkUrl, isCustomLinkIcon, normalizeLinkIconKey } from "@/lib/links";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { getPlatform } from "@/lib/social-platforms";
import type { LinkFormState } from "@/lib/types/link";
import type { LinkAnimation } from "@/lib/types/settings";
import { revalidateAfterProfileAppearanceChange } from "@/lib/profile-presets/revalidate";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub as string;
}

async function ensureProfileRow(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({ id: userId });
    return null;
  }

  return profile.username;
}

function parsePageId(formData?: FormData | null): string | null {
  if (!formData) return null;
  const raw = String(formData.get("_page_id") ?? "").trim();
  return raw || null;
}

function applyPageFilter<T extends { eq: (col: string, val: string) => T; is: (col: string, val: null) => T }>(
  query: T,
  pageId: string | null,
): T {
  return pageId ? query.eq("page_id", pageId) : query.is("page_id", null);
}

async function revalidateProfilePaths(userId: string, pageId?: string | null) {
  const paths = ["/dashboard/links"];
  if (pageId) paths.push(`/dashboard/pages/${pageId}/links`);
  await revalidateAfterProfileAppearanceChange(userId, paths);
  if (pageId) {
    const { revalidateProfilePagePaths } = await import("@/lib/profile-pages/revalidate");
    await revalidateProfilePagePaths(userId, pageId);
  }
}

function validateLinkInput(title: string, url: string) {
  if (!title.trim()) {
    return "Title is required.";
  }

  if (!url.trim()) {
    return "URL is required.";
  }

  const normalized = normalizeLinkUrl(url);

  try {
    new URL(normalized);
  } catch {
    return "Please enter a valid URL.";
  }

  return null;
}

function parseLinkIcon(raw: string) {
  const icon = raw.trim() || "link";
  if (isCustomLinkIcon(icon)) {
    if (icon.length > 2048) return "link";
    return icon;
  }
  return normalizeLinkIconKey(icon).slice(0, 64);
}

export async function createLinkAction(
  _prevState: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in." };
  }

  const title = String(formData.get("title") ?? "");
  const url = String(formData.get("url") ?? "");
  const icon = parseLinkIcon(String(formData.get("icon") ?? "link"));
  const color = String(formData.get("color") ?? "#ffffff").trim() || "#ffffff";
  const backgroundColor =
    String(formData.get("background_color") ?? "rgba(255,255,255,0.05)").trim() ||
    "rgba(255,255,255,0.05)";
  const animation = (String(formData.get("animation") ?? "none") ||
    "none") as LinkAnimation;

  const validationError = validateLinkInput(title, url);
  if (validationError) {
    return { error: validationError };
  }

  const titleError = await rejectIfModerated(title, "link_title", userId);
  if (titleError) return { error: titleError };

  const urlError = await rejectIfModerated(url, "link_url", userId);
  if (urlError) return { error: urlError };

  await ensureProfileRow(userId);

  const supabase = await createClient();
  const pageId = parsePageId(formData);

  let lastLinkQuery = supabase
    .from("links")
    .select("sort_order")
    .eq("profile_id", userId);
  lastLinkQuery = applyPageFilter(lastLinkQuery, pageId);
  const { data: lastLink } = await lastLinkQuery
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (lastLink?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("links").insert({
    profile_id: userId,
    page_id: pageId,
    title: title.trim(),
    url: normalizeLinkUrl(url),
    icon,
    color,
    background_color: backgroundColor,
    animation,
    sort_order: sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  await revalidateProfilePaths(userId, pageId);
  return { success: "Link added." };
}

export async function createSocialLinkAction(
  _prevState: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const pageId = parsePageId(formData);
  const platformId = String(formData.get("platform") ?? "");
  const input = String(formData.get("input") ?? "").trim();
  const platform = getPlatform(platformId);

  if (!platform) return { error: "Invalid platform." };
  if (!input) return { error: "Username or URL is required." };

  const url = normalizeLinkUrl(platform.buildUrl(input));
  try {
    new URL(url);
  } catch {
    return { error: "Please enter a valid username or URL." };
  }

  const title = platform.buildTitle(input);
  const titleError = await rejectIfModerated(title, "link_title", userId);
  if (titleError) return { error: titleError };

  const urlError = await rejectIfModerated(url, "link_url", userId);
  if (urlError) return { error: urlError };

  await ensureProfileRow(userId);
  const supabase = await createClient();

  let lastLinkQuery = supabase
    .from("links")
    .select("sort_order")
    .eq("profile_id", userId);
  lastLinkQuery = applyPageFilter(lastLinkQuery, pageId);
  const { data: lastLink } = await lastLinkQuery
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("links").insert({
    profile_id: userId,
    page_id: pageId,
    title: platform.buildTitle(input),
    url,
    icon: platform.id,
    color: "#ffffff",
    background_color: "rgba(255,255,255,0.05)",
    animation: "none",
    sort_order: (lastLink?.sort_order ?? -1) + 1,
  });

  if (error) return { error: error.message };

  await revalidateProfilePaths(userId, pageId);
  return { success: `${platform.name} link added.` };
}

export async function updateLinkAction(
  linkId: string,
  _prevState: LinkFormState,
  formData: FormData,
  pageId?: string | null,
): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in." };
  }

  const title = String(formData.get("title") ?? "");
  const url = String(formData.get("url") ?? "");
  const icon = parseLinkIcon(String(formData.get("icon") ?? "link"));
  const color = String(formData.get("color") ?? "#ffffff").trim() || "#ffffff";
  const backgroundColor =
    String(formData.get("background_color") ?? "rgba(255,255,255,0.05)").trim() ||
    "rgba(255,255,255,0.05)";
  const animation = (String(formData.get("animation") ?? "none") ||
    "none") as LinkAnimation;

  const validationError = validateLinkInput(title, url);
  if (validationError) {
    return { error: validationError };
  }

  const titleError = await rejectIfModerated(title, "link_title", userId);
  if (titleError) return { error: titleError };

  const urlError = await rejectIfModerated(url, "link_url", userId);
  if (urlError) return { error: urlError };

  const resolvedPageId = pageId ?? parsePageId(formData);
  const supabase = await createClient();
  let updateQuery = supabase
    .from("links")
    .update({
      title: title.trim(),
      url: normalizeLinkUrl(url),
      icon,
      color,
      background_color: backgroundColor,
      animation,
    })
    .eq("id", linkId)
    .eq("profile_id", userId);
  updateQuery = applyPageFilter(updateQuery, resolvedPageId);
  const { error } = await updateQuery;

  if (error) {
    return { error: error.message };
  }

  await revalidateProfilePaths(userId, resolvedPageId);
  return { success: "Link updated." };
}

export async function deleteLinkAction(linkId: string, pageId?: string | null): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("profile_id", userId);

  if (error) {
    return { error: error.message };
  }

  await revalidateProfilePaths(userId, pageId);
  return { success: "Link deleted." };
}

export async function moveLinkAction(
  linkId: string,
  direction: "up" | "down",
  pageId?: string | null,
): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in." };
  }

  const supabase = await createClient();
  let linksQuery = supabase.from("links").select("id, sort_order").eq("profile_id", userId);
  linksQuery = applyPageFilter(linksQuery, pageId ?? null);
  const { data: links } = await linksQuery.order("sort_order", { ascending: true });

  if (!links?.length) {
    return { error: "No links found." };
  }

  const index = links.findIndex((link) => link.id === linkId);
  if (index === -1) {
    return { error: "Link not found." };
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= links.length) {
    return {};
  }

  const current = links[index];
  const adjacent = links[swapIndex];

  const { error: firstError } = await supabase
    .from("links")
    .update({ sort_order: adjacent.sort_order })
    .eq("id", current.id)
    .eq("profile_id", userId);

  if (firstError) {
    return { error: firstError.message };
  }

  const { error: secondError } = await supabase
    .from("links")
    .update({ sort_order: current.sort_order })
    .eq("id", adjacent.id)
    .eq("profile_id", userId);

  if (secondError) {
    return { error: secondError.message };
  }

  await revalidateProfilePaths(userId, pageId);
  return { success: "Link moved." };
}

export async function reorderLinksAction(
  orderedIds: string[],
  pageId?: string | null,
): Promise<LinkFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "You must be logged in." };
  }

  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("links")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("profile_id", userId);

    if (error) {
      return { error: error.message };
    }
  }

  await revalidateProfilePaths(userId, pageId);
  return { success: "Links reordered." };
}
