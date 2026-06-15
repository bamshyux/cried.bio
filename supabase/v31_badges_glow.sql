-- Badge glow toggle in display settings
alter table public.profile_settings
  add column if not exists badges_glow boolean not null default true;

comment on column public.profile_settings.badges_glow is 'When true, badges show a subtle color-matched glow on profile';
