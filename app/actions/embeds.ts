"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { parseEmbedUrl } from "@/lib/embeds/parse";
import { logActivity } from "@/lib/data/activity";
import type { EmbedFormState } from "@/lib/types/embed";
import { createClient } from "@/lib/supabase/server";

export async function createEmbedAction(_prev: EmbedFormState, formData: FormData): Promise<EmbedFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const url = String(formData.get("url") ?? "").trim();
  const parsed = parseEmbedUrl(url);
  if (!parsed) return { error: "Unsupported or invalid embed URL." };

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
  });

  if (error) return { error: error.message };
  await logActivity(userId, "profile_updated", `Added ${parsed.title} embed`);
  await revalidateUserProfile(userId, ["/dashboard/embeds"]);
  return { success: "Embed added." };
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
