-- cried.bio v95: Fix new-user signup after v82 profile_settings PK change
-- v82 replaced profile_settings.profile_id PK with id + partial unique indexes.
-- handle_new_user still used ON CONFLICT (profile_id), which no longer matches a
-- full unique constraint and causes "Database error creating new user".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio)
  values (new.id, '', '')
  on conflict (id) do nothing;

  insert into public.profile_settings (profile_id)
  select new.id
  where not exists (
    select 1
    from public.profile_settings ps
    where ps.profile_id = new.id
      and ps.page_id is null
  );

  insert into public.account_preferences (profile_id)
  select new.id
  where not exists (
    select 1
    from public.account_preferences ap
    where ap.profile_id = new.id
  );

  perform public.sync_signup_badges(new.id);

  return new;
end;
$$;

notify pgrst, 'reload schema';
