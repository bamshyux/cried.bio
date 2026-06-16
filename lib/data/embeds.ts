import { createClient } from "@/lib/supabase/server";
import { mergeEmbedConfig } from "@/lib/embeds/enrich";
import type { EmbedType, ProfileEmbed } from "@/lib/types/embed";

function normalizeEmbed(row: Record<string, unknown>): ProfileEmbed {
  const embedType = row.embed_type as EmbedType;
  return {
    ...(row as ProfileEmbed),
    config: mergeEmbedConfig(embedType, row.config),
  };
}

export async function getEmbedsByProfileId(profileId: string, publicOnly = false) {
  const supabase = await createClient();
  let query = supabase
    .from("profile_embeds")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (publicOnly) query = query.eq("is_visible", true);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => normalizeEmbed(row as Record<string, unknown>));
}
