-- v108: Premium profile picture border effects

alter table public.profile_settings
  add column if not exists profile_avatar_effect text not null default 'none',
  add column if not exists profile_avatar_effect_thickness smallint not null default 3,
  add column if not exists profile_avatar_effect_speed smallint not null default 100,
  add column if not exists profile_avatar_effect_glow smallint not null default 70,
  add column if not exists profile_avatar_effect_color text not null default '',
  add column if not exists profile_avatar_effect_secondary_color text not null default '';

comment on column public.profile_settings.profile_avatar_effect is 'Animated border preset around profile avatar (premium)';
comment on column public.profile_settings.profile_avatar_effect_thickness is 'Avatar border thickness in px (1-8)';
comment on column public.profile_settings.profile_avatar_effect_speed is 'Avatar effect speed percentage (25-300)';
comment on column public.profile_settings.profile_avatar_effect_glow is 'Avatar effect glow intensity (0-100)';

notify pgrst, 'reload schema';
