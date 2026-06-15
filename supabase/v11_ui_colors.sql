-- BioForge v11: Custom profile status + music player colors
-- Run in Supabase Dashboard → SQL Editor
-- Empty string = use profile accent color

alter table public.profile_settings
  add column if not exists profile_status_color text not null default '';

alter table public.profile_settings
  add column if not exists music_player_color text not null default '';

comment on column public.profile_settings.profile_status_color is 'Status dot color; empty uses accent_color';
comment on column public.profile_settings.music_player_color is 'Music player accent; empty uses accent_color';

notify pgrst, 'reload schema';
