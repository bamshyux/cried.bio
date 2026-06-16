-- cried.bio v59: Dashboard leaderboard RPCs

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
      and not (p.uid = 1 and lower(p.username) = 'bam')
      and (p.uid is null or p.uid <> 1)
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
    where stat_count > 0
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

create or replace function public.get_most_followed_leaderboard(
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
  view_count bigint,
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
      coalesce(fc.cnt, 0)::bigint as stat_count,
      coalesce(p.view_count, 0)::bigint as view_count
    from public.profiles p
    left join (
      select f.following_id, count(*)::bigint as cnt
      from public.follows f
      where p_since is null or f.created_at >= p_since
      group by f.following_id
    ) fc on fc.following_id = p.id
    where p.username is not null
      and (
        v_search is null
        or p.username ilike '%' || v_search || '%'
        or p.display_name ilike '%' || v_search || '%'
      )
  ),
  filtered as (
    select *
    from ranked
    where stat_count > 0
  )
  select
    f.profile_id,
    f.username,
    f.display_name,
    f.avatar_url,
    f.bio,
    f.stat_count,
    f.view_count,
    count(*) over ()::bigint as total_count
  from filtered f
  order by f.stat_count desc, f.username asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.get_most_viewed_leaderboard(timestamptz, text, int, int) from public;
grant execute on function public.get_most_viewed_leaderboard(timestamptz, text, int, int) to authenticated, service_role;

revoke all on function public.get_most_followed_leaderboard(timestamptz, text, int, int) from public;
grant execute on function public.get_most_followed_leaderboard(timestamptz, text, int, int) to authenticated, service_role;

notify pgrst, 'reload schema';
