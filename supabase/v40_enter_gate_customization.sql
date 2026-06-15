-- cried.bio v40: Full click-to-enter screen customization

alter table public.profile_settings
  add column if not exists enter_gate_blur_strength int not null default 12;

alter table public.profile_settings
  add column if not exists enter_gate_background_type text not null default 'solid';

alter table public.profile_settings
  add column if not exists enter_gate_background_color text not null default '#090909';

alter table public.profile_settings
  add column if not exists enter_gate_background_image_url text;

alter table public.profile_settings
  add column if not exists enter_gate_background_video_url text;

alter table public.profile_settings
  add column if not exists enter_gate_gradient_colors text[] not null default '{#090909,#141414,#1a1a1a}';

alter table public.profile_settings
  add column if not exists enter_gate_animated_gradient boolean not null default false;

alter table public.profile_settings
  add column if not exists enter_gate_overlay_opacity int not null default 50;

alter table public.profile_settings
  add column if not exists enter_gate_vignette boolean not null default false;

alter table public.profile_settings
  add column if not exists enter_gate_noise boolean not null default false;

alter table public.profile_settings
  add column if not exists enter_gate_particle_effect text;

alter table public.profile_settings
  add column if not exists enter_gate_show_username boolean not null default true;

alter table public.profile_settings
  add column if not exists enter_gate_show_branding boolean not null default true;

alter table public.profile_settings
  add column if not exists enter_gate_title_color text not null default '';

alter table public.profile_settings
  add column if not exists enter_gate_subtitle_color text not null default '';

alter table public.profile_settings
  add column if not exists enter_gate_accent_color text not null default '';

alter table public.profile_settings
  add column if not exists enter_gate_text_align text not null default 'center';

alter table public.profile_settings
  add column if not exists enter_gate_button_style text not null default 'pill';

alter table public.profile_settings
  add column if not exists enter_gate_animation text not null default 'pulse';

alter table public.profile_settings
  add column if not exists enter_gate_glass_card boolean not null default false;

alter table public.profile_settings
  add column if not exists enter_gate_card_opacity int not null default 20;

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_background_type_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_background_type_check
  check (enter_gate_background_type in ('solid', 'image', 'video', 'gradient', 'profile'));

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_text_align_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_text_align_check
  check (enter_gate_text_align in ('left', 'center', 'right'));

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_button_style_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_button_style_check
  check (enter_gate_button_style in ('pill', 'outline', 'ghost', 'minimal', 'glow'));

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_animation_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_animation_check
  check (enter_gate_animation in ('none', 'pulse', 'fade', 'bounce', 'glow'));

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_overlay_opacity_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_overlay_opacity_check
  check (enter_gate_overlay_opacity >= 0 and enter_gate_overlay_opacity <= 100);

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_card_opacity_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_card_opacity_check
  check (enter_gate_card_opacity >= 0 and enter_gate_card_opacity <= 100);

alter table public.profile_settings
  drop constraint if exists profile_settings_enter_gate_blur_strength_check;

alter table public.profile_settings
  add constraint profile_settings_enter_gate_blur_strength_check
  check (enter_gate_blur_strength >= 0 and enter_gate_blur_strength <= 30);

notify pgrst, 'reload schema';
