-- v98: Replace page_entrance boolean with page_entrance_animation options.

alter table public.profile_settings
  add column if not exists page_entrance_animation text not null default 'pop-in';

update public.profile_settings
set page_entrance_animation = case
  when coalesce(page_entrance, true) = false then 'none'
  else 'pop-in'
end
where page_entrance_animation = 'pop-in';

alter table public.profile_settings drop constraint if exists profile_settings_page_entrance_animation_check;

alter table public.profile_settings add constraint profile_settings_page_entrance_animation_check
  check (page_entrance_animation in (
    'none', 'pop-in', 'unfold', 'slide-up', 'zoom-burst', 'flip', 'curtain',
    'drop', 'spiral', 'glide', 'elastic', 'spotlight'
  ));
