-- v103: Optional hide for layout decorative outer borders

alter table public.profile_settings
  add column if not exists layout_hide_border boolean not null default false;

comment on column public.profile_settings.layout_hide_border is 'When true, hides the decorative outer border/frame of the active layout';
