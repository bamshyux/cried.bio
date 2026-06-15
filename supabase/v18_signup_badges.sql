-- BioForge v18: Auto-award Year One + OG badges on signup
-- Year One: all new accounts during the first year (until BIOFORGE_YEAR_ONE_END / default Jun 14, 2027)
-- OG: first 50 profiles by sequential uid
-- Safe to re-run

-- ─── Badge metadata ───────────────────────────────────────────────────────────

update public.badges
set
  award_rule = 'signup_year_one',
  is_assignable = false
where slug = 'year-one';

update public.badges
set
  is_assignable = false
where slug = 'og';

-- ─── Signup badge sync (idempotent) ─────────────────────────────────────────

create or replace function public.sync_signup_badges(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid bigint;
  v_year_one_end constant timestamptz := '2027-06-14T23:59:59.999Z';
begin
  select uid into v_uid
  from public.profiles
  where id = p_profile_id;

  insert into public.profile_badges (profile_id, badge_id, award_source)
  select p_profile_id, b.id, 'event'
  from public.badges b
  where (
    (now() < v_year_one_end and b.slug = 'year-one') or
    (v_uid is not null and v_uid <= 50 and b.slug = 'og')
  )
  on conflict (profile_id, badge_id) do nothing;
end;
$$;

revoke all on function public.sync_signup_badges(uuid) from public;
grant execute on function public.sync_signup_badges(uuid) to anon, authenticated, service_role;

-- ─── Include signup badges in full milestone sync ───────────────────────────

create or replace function public.sync_all_milestone_badges(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_views bigint;
  v_followers bigint;
  v_created timestamptz;
begin
  perform public.sync_signup_badges(p_profile_id);

  select count(*)::bigint into v_views
  from public.analytics_events
  where profile_id = p_profile_id and event_type = 'profile_view';

  select count(*)::bigint into v_followers
  from public.follows
  where following_id = p_profile_id;

  select created_at into v_created
  from public.profiles
  where id = p_profile_id;

  insert into public.profile_badges (profile_id, badge_id, award_source)
  select p_profile_id, b.id, 'analytics'
  from public.badges b
  where (
    (v_views >= 100 and b.slug = 'views-100') or
    (v_views >= 1000 and b.slug = 'views-1k') or
    (v_views >= 10000 and b.slug = 'views-10k') or
    (v_views >= 100000 and b.slug = 'views-100k') or
    (v_followers >= 100 and b.slug = 'followers-100') or
    (v_created is not null and v_created <= now() - interval '1 year' and b.slug = 'account-1yr')
  )
  on conflict (profile_id, badge_id) do nothing;
end;
$$;

-- ─── Award on new account creation ────────────────────────────────────────────

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

  perform public.sync_signup_badges(new.id);

  return new;
end;
$$;

-- ─── Backfill existing users ────────────────────────────────────────────────

insert into public.profile_badges (profile_id, badge_id, award_source)
select p.id, b.id, 'event'
from public.profiles p
cross join public.badges b
where b.slug = 'year-one'
  and now() < '2027-06-14T23:59:59.999Z'::timestamptz
on conflict (profile_id, badge_id) do nothing;

insert into public.profile_badges (profile_id, badge_id, award_source)
select p.id, b.id, 'event'
from public.profiles p
cross join public.badges b
where b.slug = 'og'
  and p.uid is not null
  and p.uid <= 50
on conflict (profile_id, badge_id) do nothing;

notify pgrst, 'reload schema';
