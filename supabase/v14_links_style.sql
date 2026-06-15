-- BioForge v14: link display style (buttons vs icon boxes)
-- Run in Supabase Dashboard → SQL Editor (after v13)

alter table public.profile_settings
  add column if not exists links_style text not null default 'buttons';

alter table public.profile_settings
  drop constraint if exists profile_settings_links_style_check;

alter table public.profile_settings
  add constraint profile_settings_links_style_check
  check (links_style in ('buttons', 'icons'));
