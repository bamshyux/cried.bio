-- cried.bio v107: Custom cursor click point (hotspot)

alter table public.profile_settings
  add column if not exists cursor_hotspot_x numeric(5, 2) not null default 50,
  add column if not exists cursor_hotspot_y numeric(5, 2) not null default 50;

comment on column public.profile_settings.cursor_hotspot_x is
  'Horizontal click point for custom cursor image, 0–100 percent from left';
comment on column public.profile_settings.cursor_hotspot_y is
  'Vertical click point for custom cursor image, 0–100 percent from top';

notify pgrst, 'reload schema';
