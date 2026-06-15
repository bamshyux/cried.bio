-- BioForge v13: toggle follower/following counts on public profile
-- Run in Supabase Dashboard → SQL Editor (after v12)

alter table public.profile_settings
  add column if not exists show_follow_counts boolean not null default true;
