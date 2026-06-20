-- cried.bio v68: Landing profile views exclude UID #1 (founder / inflated count)

create or replace function public.public_platform_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'total_users', (select count(*)::int from public.profiles),
    'total_profiles', (select count(*)::int from public.profiles where username is not null),
    'total_profile_views', coalesce(
      nullif(
        (
          select sum(view_count)::bigint
          from public.profiles
          where username is not null
            and coalesce(uid, -1) <> 1
        ),
        0
      ),
      (
        select count(*)::bigint
        from public.analytics_events ae
        inner join public.profiles p on p.id = ae.profile_id
        where ae.event_type = 'profile_view'
          and coalesce(p.uid, -1) <> 1
      ),
      0::bigint
    ),
    'total_guestbook_posts', (select count(*)::int from public.guestbook_entries),
    'total_custom_themes', (select count(*)::int from public.custom_themes),
    'total_badges_granted', (select count(*)::int from public.profile_badges)
  );
$$;

revoke all on function public.public_platform_stats() from public;
grant execute on function public.public_platform_stats() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
