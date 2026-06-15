-- BioForge v10: Monochrome links + profile parallax
-- Run in Supabase Dashboard → SQL Editor

alter table public.profile_settings
  add column if not exists links_monochrome boolean not null default false;

alter table public.profile_settings
  add column if not exists profile_parallax boolean not null default false;

comment on column public.profile_settings.links_monochrome is 'When true, link icons use text_color instead of platform brand colors';
comment on column public.profile_settings.profile_parallax is 'When true, profile card tilts on hover';

notify pgrst, 'reload schema';
