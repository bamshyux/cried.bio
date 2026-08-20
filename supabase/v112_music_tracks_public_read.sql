-- Allow public profile visitors to read playlist tracks (owner policy remains for writes)

drop policy if exists profile_music_tracks_public_read on public.profile_music_tracks;

create policy profile_music_tracks_public_read on public.profile_music_tracks
  for select using (true);

notify pgrst, 'reload schema';
