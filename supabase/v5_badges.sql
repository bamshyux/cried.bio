-- cried.bio v5: Badge ecosystem
-- Run after v2_features.sql (badges tables) + v3/v4 profile_settings
-- Safe to re-run

-- ─── Extend badges catalog ───────────────────────────────────────────────────

alter table public.badges add column if not exists category text not null default 'custom';
alter table public.badges add column if not exists rarity text not null default 'common';
alter table public.badges add column if not exists sort_order integer not null default 0;
alter table public.badges add column if not exists is_assignable boolean not null default true;
alter table public.badges add column if not exists award_rule text;

comment on column public.badges.icon is 'Icon slug mapped to SVG in the app (not emoji)';
comment on column public.badges.award_rule is 'Optional auto-award key: milestone_views_1000, seasonal_halloween_2026, etc.';

do $$ begin
  alter table public.badges add constraint badges_category_check
    check (category in (
      'verification', 'creator', 'supporter', 'community',
      'milestone', 'competition', 'seasonal', 'custom'
    ));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.badges add constraint badges_rarity_check
    check (rarity in ('common', 'rare', 'epic', 'legendary', 'mythic'));
exception when duplicate_object then null;
end $$;

-- Admins can update custom badges
drop policy if exists "Admins can update badges" on public.badges;
create policy "Admins can update badges"
on public.badges for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

-- ─── Extend profile badge assignments ────────────────────────────────────────

alter table public.profile_badges add column if not exists is_visible boolean not null default true;
alter table public.profile_badges add column if not exists is_featured boolean not null default false;
alter table public.profile_badges add column if not exists sort_order integer not null default 0;
alter table public.profile_badges add column if not exists award_source text not null default 'manual';
alter table public.profile_badges add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.profile_badges.award_source is
  'manual | premium | analytics | event | discord | seasonal | staff';

-- Users manage display of their own badges
drop policy if exists "Users can update own badge display" on public.profile_badges;
create policy "Users can update own badge display"
on public.profile_badges for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- ─── Profile badge display settings ──────────────────────────────────────────

alter table public.profile_settings add column if not exists show_badges boolean not null default true;
alter table public.profile_settings add column if not exists badge_display_limit integer not null default 5
  check (badge_display_limit between 0 and 20);

comment on column public.profile_settings.badge_display_limit is 'Max badges on public profile; 0 = show all visible';

-- ─── Migrate legacy early_adopter → og (before seed, avoids slug collision) ───

do $$
declare
  og_id uuid;
  legacy_id uuid;
begin
  select id into legacy_id from public.badges where slug = 'early_adopter';
  if legacy_id is null then
    return;
  end if;

  select id into og_id from public.badges where slug = 'og';

  if og_id is not null then
    -- og already exists: move assignments, remove duplicate badge row
    update public.profile_badges pb
    set badge_id = og_id
    where pb.badge_id = legacy_id
      and not exists (
        select 1 from public.profile_badges pb2
        where pb2.profile_id = pb.profile_id and pb2.badge_id = og_id
      );
    delete from public.profile_badges where badge_id = legacy_id;
    delete from public.badges where id = legacy_id;
  else
    update public.badges
    set slug = 'og',
        name = 'OG',
        icon = 'og',
        category = 'milestone',
        rarity = 'legendary',
        description = 'Joined during the cried.bio launch era'
    where id = legacy_id;
  end if;
end $$;

-- ─── Seed system badges (upsert by slug) ─────────────────────────────────────

insert into public.badges (slug, name, icon, color, description, category, rarity, sort_order, is_system, award_rule) values
  -- Verification & team
  ('verified', 'Verified', 'verified', '#3b82f6', 'Identity verified by cried.bio', 'verification', 'legendary', 10, true, null),
  ('developer', 'Developer', 'developer', '#fafafa', 'cried.bio developer', 'verification', 'mythic', 20, true, null),
  ('staff', 'Staff', 'staff', '#a855f7', 'cried.bio staff member', 'verification', 'mythic', 30, true, null),
  ('moderator', 'Moderator', 'moderator', '#22c55e', 'Community moderator', 'verification', 'epic', 40, true, null),
  -- Creator
  ('creator', 'Creator', 'creator', '#ec4899', 'Content creator partner', 'creator', 'epic', 50, true, null),
  ('partner', 'Partner', 'partner', '#f97316', 'Official cried.bio partner', 'creator', 'legendary', 60, true, null),
  -- Supporter
  ('premium', 'Premium', 'premium', '#f59e0b', 'Active premium subscriber', 'supporter', 'epic', 70, true, null),
  ('founder', 'Founder', 'founder', '#eab308', 'Founder of cried.bio', 'verification', 'legendary', 80, true, null),
  ('donor', 'Donor', 'donor', '#ef4444', 'Donated to support cried.bio', 'supporter', 'rare', 90, true, null),
  ('supporter', 'Supporter', 'supporter', '#06b6d4', 'Purchased a premium feature', 'supporter', 'common', 100, true, null),
  -- Community
  ('helper', 'Helper', 'helper', '#14b8a6', 'Helps users in the community', 'community', 'common', 110, true, null),
  ('bug-hunter', 'Bug Hunter', 'bug-hunter', '#84cc16', 'Reported valid bugs', 'community', 'rare', 120, true, null),
  ('contributor', 'Contributor', 'contributor', '#6366f1', 'Contributed assets or code', 'community', 'rare', 130, true, null),
  ('community-choice', 'Community Choice', 'community-choice', '#d946ef', 'Awarded by staff for community impact', 'community', 'epic', 140, true, null),
  -- Milestones
  ('og', 'OG', 'og', '#fbbf24', 'Joined during the cried.bio launch era', 'milestone', 'legendary', 150, true, 'milestone_og'),
  ('year-one', 'Year One', 'year-one', '#c084fc', 'Joined in cried.bio''s first year', 'milestone', 'epic', 160, true, null),
  ('views-100', '100 Views', 'views-100', '#94a3b8', 'Reached 100 profile views', 'milestone', 'common', 170, true, 'milestone_views_100'),
  ('views-1k', '1K Views', 'views-1k', '#64748b', 'Reached 1,000 profile views', 'milestone', 'rare', 180, true, 'milestone_views_1000'),
  ('views-10k', '10K Views', 'views-10k', '#475569', 'Reached 10,000 profile views', 'milestone', 'epic', 190, true, 'milestone_views_10000'),
  ('views-100k', '100K Views', 'views-100k', '#334155', 'Reached 100,000 profile views', 'milestone', 'legendary', 200, true, 'milestone_views_100000'),
  -- Competition
  ('champion', 'Champion', 'champion', '#fbbf24', 'Event winner', 'competition', 'legendary', 210, true, null),
  ('runner-up', 'Runner-Up', 'runner-up', '#c0c0c0', 'Second place finish', 'competition', 'epic', 220, true, null),
  ('finalist', 'Finalist', 'finalist', '#cd7f32', 'Top competition placement', 'competition', 'rare', 230, true, null),
  ('tournament-winner', 'Tournament Winner', 'tournament-winner', '#ffd700', 'Tournament competition winner', 'competition', 'mythic', 240, true, null),
  -- Seasonal (limited-time campaigns; ownership permanent once earned)
  ('halloween-2026', 'Halloween 2026', 'halloween-2026', '#f97316', 'Halloween 2026 event badge', 'seasonal', 'epic', 300, true, 'seasonal_halloween_2026'),
  ('christmas-2026', 'Christmas 2026', 'christmas-2026', '#ef4444', 'Christmas 2026 event badge', 'seasonal', 'epic', 310, true, 'seasonal_christmas_2026'),
  ('new-year-2027', 'New Year 2027', 'new-year-2027', '#a855f7', 'New Year 2027 event badge', 'seasonal', 'epic', 320, true, 'seasonal_new_year_2027'),
  ('summer-2026', 'Summer Event', 'summer-2026', '#0ea5e9', 'Summer 2026 event badge', 'seasonal', 'epic', 330, true, 'seasonal_summer_2026')
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  description = excluded.description,
  category = excluded.category,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  award_rule = excluded.award_rule;

notify pgrst, 'reload schema';
