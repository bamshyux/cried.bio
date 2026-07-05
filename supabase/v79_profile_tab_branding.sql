alter table public.profile_settings
  add column if not exists profile_favicon_url text,
  add column if not exists tab_title_animation text not null default 'none';
