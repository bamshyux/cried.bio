-- v83: Expanded link display customization (profile + content pages)

alter table public.profile_settings
  add column if not exists links_spacing text not null default 'default';

alter table public.profile_settings
  drop constraint if exists profile_settings_links_spacing_check;

alter table public.profile_settings
  add constraint profile_settings_links_spacing_check
  check (links_spacing in ('compact', 'default', 'relaxed'));

alter table public.profile_settings
  add column if not exists links_button_style text not null default 'filled';

alter table public.profile_settings
  drop constraint if exists profile_settings_links_button_style_check;

alter table public.profile_settings
  add constraint profile_settings_links_button_style_check
  check (links_button_style in ('filled', 'outline', 'ghost'));

alter table public.profile_settings
  add column if not exists links_border_radius int not null default 0;

alter table public.profile_settings
  drop constraint if exists profile_settings_links_border_radius_check;

alter table public.profile_settings
  add constraint profile_settings_links_border_radius_check
  check (links_border_radius >= 0 and links_border_radius <= 48);

alter table public.profile_settings
  add column if not exists links_button_opacity int not null default 100;

alter table public.profile_settings
  drop constraint if exists profile_settings_links_button_opacity_check;

alter table public.profile_settings
  add constraint profile_settings_links_button_opacity_check
  check (links_button_opacity >= 0 and links_button_opacity <= 100);

alter table public.profile_settings
  add column if not exists links_show_hostname boolean not null default false;

comment on column public.profile_settings.links_spacing is 'Gap between links: compact, default, relaxed';
comment on column public.profile_settings.links_button_style is 'Full-button look: filled, outline, ghost';
comment on column public.profile_settings.links_border_radius is 'Link corner radius; 0 uses profile card border_radius';
comment on column public.profile_settings.links_button_opacity is 'Filled button background strength 0-100';
comment on column public.profile_settings.links_show_hostname is 'Always show link hostname on full buttons';
