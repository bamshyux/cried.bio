-- cried.bio v76: Reliable profile view counting (keep existing counts, fix going forward)

create or replace function public.increment_profile_view_count(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set view_count = view_count + 1
  where id = p_profile_id
    and username is not null
    and not coalesce(view_count_frozen, false);
end;
$$;

revoke all on function public.increment_profile_view_count(uuid) from public;
grant execute on function public.increment_profile_view_count(uuid) to anon, authenticated, service_role;

-- Public display uses the denormalized counter maintained on each unique view.
create or replace function public.get_public_profile_view_count(p_profile_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_count bigint;
begin
  select coalesce(p.view_count, 0)::bigint
  into v_count
  from public.profiles p
  where p.id = p_profile_id
    and p.username is not null;

  if not found then
    return 0;
  end if;

  return v_count;
end;
$$;

revoke all on function public.get_public_profile_view_count(uuid) from public;
grant execute on function public.get_public_profile_view_count(uuid) to anon, authenticated, service_role;

-- One view per profile + visitor identity (dedupes repeat visits from the same browser/device).
create unique index if not exists analytics_events_profile_view_dedup_uidx
  on public.analytics_events (profile_id, visitor_hash)
  where event_type = 'profile_view';

drop trigger if exists analytics_events_bump_view_count on public.analytics_events;

create or replace function public.record_profile_view(
  p_profile_id uuid,
  p_visitor_hash text,
  p_country text default 'Unknown'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted uuid;
  v_viewer uuid := auth.uid();
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and username is not null
  ) then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and coalesce(view_count_frozen, false)
  ) then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  if v_viewer = p_profile_id then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  insert into public.analytics_events (profile_id, event_type, visitor_hash, country)
  values (
    p_profile_id,
    'profile_view',
    left(coalesce(p_visitor_hash, ''), 64),
    left(coalesce(nullif(trim(p_country), ''), 'Unknown'), 64)
  )
  on conflict (profile_id, visitor_hash) where (event_type = 'profile_view')
  do nothing
  returning id into v_inserted;

  if v_inserted is not null then
    perform public.increment_profile_view_count(p_profile_id);
    return jsonb_build_object('ok', true, 'recorded', true);
  end if;

  return jsonb_build_object('ok', true, 'deduplicated', true);
end;
$$;

revoke all on function public.record_profile_view(uuid, text, text) from public;
grant execute on function public.record_profile_view(uuid, text, text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
