-- cried.bio v15: toggle recent activity on public profile
-- Run in Supabase Dashboard → SQL Editor (after v14)

alter table public.profile_settings
  add column if not exists show_activity boolean not null default true;
