-- Default @username to visible; only hide when user opts in
alter table public.profile_settings
  alter column hide_profile_handle set default false;

update public.profile_settings
  set hide_profile_handle = false
  where hide_profile_handle = true;
