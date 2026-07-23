-- v84: Premium page navigation bar placement

alter table public.profile_settings
  add column if not exists page_nav_position text not null default 'top';

alter table public.profile_settings
  drop constraint if exists profile_settings_page_nav_position_check;

alter table public.profile_settings
  add constraint profile_settings_page_nav_position_check
  check (page_nav_position in ('top', 'bottom', 'left', 'right', 'hidden'));

comment on column public.profile_settings.page_nav_position is
  'Placement of multi-page site nav tabs: top, bottom, left, right, or hidden';
