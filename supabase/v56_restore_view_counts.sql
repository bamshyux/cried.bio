-- cried.bio v56: Restore profile view counts from analytics (non-frozen profiles only)

alter table public.profiles
  add column if not exists view_count bigint not null default 0;

alter table public.profiles
  add column if not exists view_count_frozen boolean not null default false;

-- Restore denormalized counts from the analytics source of truth
update public.profiles p
set view_count = sub.cnt
from (
  select profile_id, count(*)::bigint as cnt
  from public.analytics_events
  where event_type = 'profile_view'
  group by profile_id
) sub
where p.id = sub.profile_id
  and not coalesce(p.view_count_frozen, false);

-- Keep @bam (uid 1) on the fixed public count
update public.profiles
set
  view_count = 8675309,
  view_count_frozen = true
where lower(username) = 'bam'
  and uid = 1;

-- Public read: frozen profiles return fixed count; everyone else uses analytics rows
create or replace function public.get_public_profile_view_count(p_profile_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_frozen boolean;
begin
  select coalesce(view_count_frozen, false)
  into v_frozen
  from public.profiles
  where id = p_profile_id
    and username is not null;

  if not found then
    return 0;
  end if;

  if v_frozen then
    return 8675309;
  end if;

  return (
    select count(*)::bigint
    from public.analytics_events
    where profile_id = p_profile_id
      and event_type = 'profile_view'
  );
end;
$$;

revoke all on function public.get_public_profile_view_count(uuid) from public;
grant execute on function public.get_public_profile_view_count(uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
