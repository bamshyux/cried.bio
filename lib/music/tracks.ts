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

export function sortMusicTracks(tracks: MusicTrack[]): MusicTrack[] {
  return [...tracks].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );
}
