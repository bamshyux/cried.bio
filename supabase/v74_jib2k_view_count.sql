-- cried.bio v74: Seed @jib2k with 500 views (live counter, not frozen)

-- Use profiles.view_count as the public source of truth for non-frozen profiles.
-- The analytics trigger still increments view_count on each new unique visitor.
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

-- Leaderboard: exclude frozen display counts only (not every uid 1 profile)
create or replace function public.get_most_viewed_leaderboard(
  p_since timestamptz default null,
  p_search text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  stat_count bigint,
  follower_count bigint,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_search text := nullif(trim(p_search), '');
begin
  return query
  with ranked as (
    select
      p.id as profile_id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.bio,
      case
        when p_since is null then coalesce(p.view_count, 0)::bigint
        else coalesce(v.cnt, 0)::bigint
      end as stat_count,
      coalesce(fc.cnt, 0)::bigint as follower_count
    from public.profiles p
    left join (
      select ae.profile_id, count(*)::bigint as cnt
      from public.analytics_events ae
      where ae.event_type = 'profile_view'
        and (p_since is null or ae.created_at >= p_since)
      group by ae.profile_id
    ) v on v.profile_id = p.id
    left join (
      select f.following_id, count(*)::bigint as cnt
      from public.follows f
      group by f.following_id
    ) fc on fc.following_id = p.id
    where p.username is not null
      and not coalesce(p.view_count_frozen, false)
      and (
        v_search is null
        or p.username ilike '%' || v_search || '%'
        or p.display_name ilike '%' || v_search || '%'
      )
      and (
        p_since is null
        or coalesce(v.cnt, 0) > 0
      )
  ),
  filtered as (
    select *
    from ranked
  )
  select
    f.profile_id,
    f.username,
    f.display_name,
    f.avatar_url,
    f.bio,
    f.stat_count,
    f.follower_count,
    count(*) over ()::bigint as total_count
  from filtered f
  order by f.stat_count desc, f.username asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.get_most_viewed_leaderboard(timestamptz, text, int, int) from public;
grant execute on function public.get_most_viewed_leaderboard(timestamptz, text, int, int) to authenticated, service_role;

-- @jib2k: boosted starting count; views still increment for new visitors
update public.profiles
set
  view_count = greatest(coalesce(view_count, 0), 500),
  view_count_frozen = false
where lower(username) = 'jib2k';

notify pgrst, 'reload schema';
