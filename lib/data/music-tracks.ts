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
  let tracks = (data as MusicTrack[]) ?? [];

  const { getUserEntitlements } = await import("@/lib/premium/entitlements");
  const entitlements = await getUserEntitlements(profileId);
  if (tracks.length > entitlements.max_music_tracks) {
    tracks = tracks.slice(0, entitlements.max_music_tracks);
  }

  return tracks;
}
