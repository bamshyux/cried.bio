-- Hide gray @username handle on public profile (default: hidden)
alter table public.profile_settings
  add column if not exists hide_profile_handle boolean not null default true;

comment on column public.profile_settings.hide_profile_handle is
  'When true, the @username handle is hidden below the display name on the public profile';
