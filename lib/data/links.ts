import { createClient } from "@/lib/supabase/server";

export async function getLinksByProfileId(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((link) => ({
    ...link,
    color: link.color ?? "#ffffff",
    background_color: link.background_color ?? "rgba(255,255,255,0.05)",
    animation: link.animation ?? "none",
    is_featured: link.is_featured ?? false,
  }));
}
