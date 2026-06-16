-- cried.bio v47: Bio text styling on public profiles

alter table public.profile_settings
  add column if not exists bio_color text not null default '',
  add column if not exists bio_font_family text not null default '',
  add column if not exists bio_font_size int not null default 16,
  add column if not exists bio_font_weight int not null default 400,
  add column if not exists bio_italic boolean not null default false,
  add column if not exists bio_glow boolean not null default false,
  add column if not exists bio_letter_spacing text not null default 'normal';

alter table public.profile_settings
  drop constraint if exists profile_settings_bio_font_size_check;

alter table public.profile_settings
  add constraint profile_settings_bio_font_size_check
  check (bio_font_size between 12 and 32);

alter table public.profile_settings
  drop constraint if exists profile_settings_bio_font_weight_check;

alter table public.profile_settings
  add constraint profile_settings_bio_font_weight_check
  check (bio_font_weight in (400, 500, 600, 700));

alter table public.profile_settings
  drop constraint if exists profile_settings_bio_letter_spacing_check;

alter table public.profile_settings
  add constraint profile_settings_bio_letter_spacing_check
  check (bio_letter_spacing in ('normal', 'wide', 'wider'));

notify pgrst, 'reload schema';
