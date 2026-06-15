-- BioForge v9: Auto-award view milestone badges (100, 1K, 10K, 100K views)
-- Run in Supabase Dashboard → SQL Editor (after v5_badges.sql + analytics_events)

create or replace function public.sync_view_milestone_badges(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_views bigint;
begin
  select count(*)::bigint into v_views
  from public.analytics_events
  where profile_id = p_profile_id
    and event_type = 'profile_view';

  insert into public.profile_badges (profile_id, badge_id, award_source)
  select p_profile_id, b.id, 'analytics'
  from public.badges b
  where (
    (v_views >= 100 and b.slug = 'views-100') or
    (v_views >= 1000 and b.slug = 'views-1k') or
    (v_views >= 10000 and b.slug = 'views-10k') or
    (v_views >= 100000 and b.slug = 'views-100k')
  )
  on conflict (profile_id, badge_id) do nothing;
end;
$$;

revoke all on function public.sync_view_milestone_badges(uuid) from public;
grant execute on function public.sync_view_milestone_badges(uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
