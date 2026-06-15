import { createClient } from "@/lib/supabase/server";
import type { ProfileEmbed } from "@/lib/types/embed";

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
  return (data ?? []) as ProfileEmbed[];
}
