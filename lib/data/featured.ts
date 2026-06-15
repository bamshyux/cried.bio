import { createClient } from "@/lib/supabase/server";
import type { FeaturedBlock } from "@/lib/types/featured";

export async function getFeaturedBlocksByProfileId(profileId: string, publicOnly = false) {
  const supabase = await createClient();
  let query = supabase
    .from("featured_blocks")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (publicOnly) query = query.eq("is_enabled", true);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as FeaturedBlock[];
}

export async function countFeaturedBlocks(profileId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("featured_blocks")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);
  return count ?? 0;
}
