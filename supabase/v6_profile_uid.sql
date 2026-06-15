-- BioForge v6: Sequential profile UID (guns.lol style — UID #1, #2, …)
-- Run in Supabase Dashboard → SQL Editor (after profiles.sql + v2_features.sql)

create sequence if not exists public.profiles_uid_seq;

alter table public.profiles
  add column if not exists uid bigint;

-- Ensure every auth user has a profile row (ordered by account creation)
insert into public.profiles (id, display_name, bio, created_at)
select u.id, '', '', u.created_at
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- Backfill UIDs in account-creation order
with ranked as (
  select id, row_number() over (order by created_at asc, id asc) as rn
  from public.profiles
)
update public.profiles p
set uid = r.rn
from ranked r
where p.id = r.id
  and p.uid is null;

select setval(
  'public.profiles_uid_seq',
  coalesce((select max(uid) from public.profiles), 0) + 1,
  false
);

alter table public.profiles
  alter column uid set default nextval('public.profiles_uid_seq');

alter table public.profiles
  alter column uid set not null;

create unique index if not exists profiles_uid_idx on public.profiles (uid);

-- Auto-create profile (+ settings row) when someone signs up
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
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

notify pgrst, 'reload schema';
