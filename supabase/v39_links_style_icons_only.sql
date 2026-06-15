-- cried.bio v39: add icons-only link display style (bare icons, no box or title)

alter table public.profile_settings
  drop constraint if exists profile_settings_links_style_check;

alter table public.profile_settings
  add constraint profile_settings_links_style_check
  check (links_style in ('buttons', 'icons', 'icons_only'));
