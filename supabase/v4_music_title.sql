-- BioForge v4: add music_title to profile_settings
-- Safe to re-run (IF NOT EXISTS)
--
-- Verified against live Supabase: all other v3 columns exist; only music_title is missing.
-- Run in Supabase Dashboard → SQL Editor.

alter table public.profile_settings
  add column if not exists music_title text not null default '';

comment on column public.profile_settings.music_title is
  'Display title shown in the public profile music player';

-- Notify PostgREST to reload schema cache (Supabase SQL Editor runs as superuser)
notify pgrst, 'reload schema';
