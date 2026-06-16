"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { parseEmbedUrl } from "@/lib/embeds/parse";
import { buildInitialEmbedConfig, enrichRobloxProfileEmbed, mergeEmbedConfig, refreshEmbedMediaConfig } from "@/lib/embeds/enrich";
import { logActivity } from "@/lib/data/activity";
import type { EmbedConfig, EmbedFormState, EmbedType } from "@/lib/types/embed";
import { createClient } from "@/lib/supabase/server";

export async function createEmbedAction(_prev: EmbedFormState, formData: FormData): Promise<EmbedFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const url = String(formData.get("url") ?? "").trim();
  const parsedRaw = parseEmbedUrl(url);
  if (!parsedRaw) return { error: "Unsupported or invalid embed URL." };

  const parsed = await enrichRobloxProfileEmbed(parsedRaw);
  const config = await buildInitialEmbedConfig(parsed);

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_embeds")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  const { error } = await supabase.from("profile_embeds").insert({
    profile_id: userId,
    embed_type: parsed.embed_type,
    url: parsed.url,
    title: parsed.title,
    embed_id: parsed.embed_id,
    sort_order: count ?? 0,
    config,
  });

  if (error) return { error: error.message };
  await logActivity(userId, "profile_updated", `Added ${parsed.title} embed`);
  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: "Embed added." };
}

export async function updateEmbedConfigAction(embedId: string, config: Partial<EmbedConfig>) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("profile_embeds")
    .select("embed_type, embed_id, config")
    .eq("id", embedId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (fetchError || !existing) return { error: "Embed not found." };

  const embedType = existing.embed_type as EmbedType;
  const current = mergeEmbedConfig(embedType, existing.config);
  let next = mergeEmbedConfig(embedType, { ...current, ...config });
  next = await refreshEmbedMediaConfig(embedType, existing.embed_id, next);

  const { error } = await supabase
    .from("profile_embeds")
    .update({ config: next })
    .eq("id", embedId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };
  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: true, config: next };
}

export async function toggleEmbedAction(embedId: string, visible: boolean) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_embeds")
    .update({ is_visible: visible })
    .eq("id", embedId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };
  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: true };
}

export async function deleteEmbedAction(embedId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_embeds")
    .delete()
    .eq("id", embedId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };
  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: true };
}

export async function reorderEmbedsAction(ids: string[]) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("profile_embeds")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("profile_id", userId),
    ),
  );

  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: true };
}
