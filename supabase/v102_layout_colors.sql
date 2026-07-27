-- v102: Per-layout theme color overrides (Customize tab)

alter table public.profile_settings
  add column if not exists layout_primary_color text not null default '',
  add column if not exists layout_secondary_color text not null default '',
  add column if not exists layout_tertiary_color text not null default '';

comment on column public.profile_settings.layout_primary_color is 'Override primary theme color for layouts with fixed palettes';
comment on column public.profile_settings.layout_secondary_color is 'Override secondary theme color for multi-accent layouts';
comment on column public.profile_settings.layout_tertiary_color is 'Override tertiary theme color for multi-accent layouts';
