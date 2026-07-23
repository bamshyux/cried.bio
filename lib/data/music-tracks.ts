import { createClient } from "@/lib/supabase/server";

export type MusicTrack = {
  id: string;
  profile_id: string;
  page_id: string | null;
  url: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getMusicTracks(
  profileId: string,
  pageId?: string | null,
): Promise<MusicTrack[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profile_music_tracks")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (pageId) {
    query = query.eq("page_id", pageId);
  } else {
    query = query.is("page_id", null);
  }

  const { data } = await query;
  return (data as MusicTrack[]) ?? [];
}
