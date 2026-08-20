import { sortMusicTracks, type MusicTrack } from "@/lib/music/tracks";
import { createClient } from "@/lib/supabase/server";

export type { MusicTrack } from "@/lib/music/tracks";
export { sortMusicTracks } from "@/lib/music/tracks";

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

  return sortMusicTracks(tracks);
}

/** Content pages inherit the main profile playlist when they have no page-specific tracks. */
export async function getMusicTracksForPublicPage(
  profileId: string,
  pageId: string,
): Promise<MusicTrack[]> {
  const pageTracks = await getMusicTracks(profileId, pageId);
  if (pageTracks.length > 0) return pageTracks;
  return getMusicTracks(profileId);
}
