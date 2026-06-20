-- cried.bio v55: Landing page admin content + public read helpers
-- Run in Supabase Dashboard → SQL Editor (after v54)

-- view_count is normally added in v33; ensure it exists before stats RPC
alter table public.profiles
  add column if not exists view_count bigint not null default 0;

-- ─── Admin-curated featured profiles ───
create table if not exists public.landing_featured_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id)
);

create index if not exists landing_featured_profiles_sort_idx
  on public.landing_featured_profiles (is_active, sort_order);

-- ─── Admin-curated testimonials ───
create table if not exists public.landing_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_title text not null default '',
  author_username text,
  author_avatar_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists landing_testimonials_sort_idx
  on public.landing_testimonials (is_active, sort_order);

-- ─── Public roadmap ───
create table if not exists public.landing_roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'planned',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint landing_roadmap_status_check
    check (status in ('completed', 'in_progress', 'planned'))
);

create index if not exists landing_roadmap_sort_idx
  on public.landing_roadmap_items (status, sort_order);

-- ─── Theme marketplace preview cards ───
create table if not exists public.landing_theme_previews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  preview_style text not null default 'linear-gradient(135deg, #1a1a1a, #333)',
  install_count int not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists landing_theme_previews_sort_idx
  on public.landing_theme_previews (is_active, sort_order);

-- Seed roadmap (only if empty)
insert into public.landing_roadmap_items (title, description, status, sort_order)
select * from (values
  ('Custom CSS themes', 'Full scoped CSS editor with live preview and 20 theme slots.', 'completed', 1),
  ('37 profile layouts', 'Classic, gaming, terminal, glass, aurora, and more preset layouts.', 'completed', 2),
  ('Guestbooks & reactions', 'Public guestbooks with emoji reactions and moderation.', 'completed', 3),
  ('Badge system', 'Milestone, signup, founder, and custom admin badges.', 'completed', 4),
  ('Analytics dashboard', 'Views, clicks, countries, and daily charts.', 'completed', 5),
  ('Discord presence', 'Live Discord status on your profile.', 'completed', 6),
  ('Theme marketplace', 'Browse, share, and install community themes.', 'in_progress', 7),
  ('Profile templates', 'One-click starter templates for creators.', 'in_progress', 8),
  ('Custom domains', 'Connect your own domain to your cried.bio page.', 'planned', 9),
  ('Team profiles', 'Shared pages for groups and collectives.', 'planned', 10),
  ('API access', 'Public API for integrations and automations.', 'planned', 11)
) as seed(title, description, status, sort_order)
where not exists (select 1 from public.landing_roadmap_items limit 1);

-- Seed theme previews (only if empty)
insert into public.landing_theme_previews (name, description, preview_style, install_count, sort_order)
select * from (values
  ('Midnight Glass', 'Frosted panels with soft glow accents.', 'linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f0f 100%)', 1240, 1),
  ('Neon Pulse', 'Electric borders and animated highlights.', 'linear-gradient(160deg, #0d0221 0%, #1a0533 45%, #050505 100%)', 980, 2),
  ('Clean Mono', 'Minimal black & white with sharp typography.', 'linear-gradient(180deg, #111 0%, #1c1c1c 50%, #090909 100%)', 2100, 3),
  ('Aurora Fade', 'Soft color washes and gradient backgrounds.', 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c0a09 100%)', 760, 4),
  ('Retro CRT', 'Scanline nostalgia with monospace vibes.', 'linear-gradient(200deg, #1a1400 0%, #2d2400 50%, #0a0a0a 100%)', 540, 5),
  ('Luxury Gold', 'Dark surfaces with warm metallic accents.', 'linear-gradient(145deg, #0a0908 0%, #1c1810 50%, #090909 100%)', 890, 6)
) as seed(name, description, preview_style, install_count, sort_order)
where not exists (select 1 from public.landing_theme_previews limit 1);

-- Public platform stats (safe aggregates, no auth required)
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
