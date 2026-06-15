-- BioForge v12: V2 feature expansion
-- Run in Supabase Dashboard → SQL Editor (after v11)

-- ─── Premium foundation ─────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists premium_tier text not null default 'free';

alter table public.profiles
  add column if not exists premium_expires_at timestamptz;

create table if not exists public.premium_entitlements (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  custom_domain boolean not null default false,
  max_featured_blocks int not null default 3,
  max_music_slots int not null default 1,
  animated_effects boolean not null default false,
  advanced_analytics boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ─── Profile settings extensions ────────────────────────────────────────────
alter table public.profile_settings
  add column if not exists status_preset text not null default 'online';

alter table public.profile_settings
  add column if not exists status_emoji text not null default '';

alter table public.profile_settings
  add column if not exists guestbook_enabled boolean not null default false;

alter table public.profile_settings
  add column if not exists guestbook_approval_required boolean not null default true;

alter table public.profile_settings
  add column if not exists widgets_mode text not null default 'compact';

alter table public.profile_settings
  add column if not exists widgets_discord_user_id text not null default '';

alter table public.profile_settings
  add column if not exists widgets_spotify_url text not null default '';

alter table public.profile_settings
  add column if not exists widgets_roblox_username text not null default '';

alter table public.profile_settings
  add column if not exists widgets_youtube_channel text not null default '';

alter table public.profile_settings
  add column if not exists widgets_twitch_username text not null default '';

alter table public.profile_settings
  add column if not exists widgets_country_code text not null default '';

alter table public.profile_settings
  add column if not exists friends_visibility text not null default 'public';

-- ─── Social embed cards ─────────────────────────────────────────────────────
create table if not exists public.profile_embeds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  embed_type text not null,
  url text not null,
  title text not null default '',
  embed_id text not null default '',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_embeds_profile_id_idx on public.profile_embeds(profile_id, sort_order);

-- ─── Featured / pinned blocks ───────────────────────────────────────────────
create table if not exists public.featured_blocks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  block_type text not null,
  title text not null,
  description text not null default '',
  thumbnail_url text,
  url text not null default '',
  accent_color text not null default '#00e5cc',
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists featured_blocks_profile_id_idx on public.featured_blocks(profile_id, sort_order);

-- ─── Guestbook ──────────────────────────────────────────────────────────────
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.guestbook_reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.guestbook_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  unique (entry_id, user_id, emoji)
);

create table if not exists public.guestbook_bans (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  banned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, banned_user_id)
);

create index if not exists guestbook_entries_profile_idx on public.guestbook_entries(profile_id, created_at desc);

-- ─── Profile widgets ────────────────────────────────────────────────────────
create table if not exists public.profile_widgets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  widget_type text not null,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, widget_type)
);

-- ─── Following ──────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows(following_id);

-- ─── Friends ────────────────────────────────────────────────────────────────
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table if not exists public.friendships (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- ─── Notifications ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  actor_id uuid references public.profiles(id) on delete set null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- ─── Activity feed ──────────────────────────────────────────────────────────
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists activity_events_profile_idx on public.activity_events(profile_id, created_at desc);

-- ─── Milestone badges (followers + account age) ─────────────────────────────
insert into public.badges (slug, name, description, icon, color, category, rarity, award_rule)
values
  ('followers-100', '100 Followers', 'Reached 100 followers', 'users', '#a855f7', 'community', 'rare', 'followers_100'),
  ('account-1yr', 'One Year', 'BioForge member for 1 year', 'calendar', '#f59e0b', 'community', 'rare', 'account_1yr')
on conflict (slug) do nothing;

-- ─── Sync all milestone badges ──────────────────────────────────────────────
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

revoke all on function public.sync_all_milestone_badges(uuid) from public;
grant execute on function public.sync_all_milestone_badges(uuid) to anon, authenticated, service_role;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.premium_entitlements enable row level security;
alter table public.profile_embeds enable row level security;
alter table public.featured_blocks enable row level security;
alter table public.guestbook_entries enable row level security;
alter table public.guestbook_reactions enable row level security;
alter table public.guestbook_bans enable row level security;
alter table public.profile_widgets enable row level security;
alter table public.follows enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;

-- Premium entitlements
drop policy if exists "premium_entitlements_select_own" on public.premium_entitlements;
create policy "premium_entitlements_select_own" on public.premium_entitlements for select using (auth.uid() = profile_id);

-- Embeds
drop policy if exists "embeds_public_read" on public.profile_embeds;
create policy "embeds_public_read" on public.profile_embeds for select using (
  is_visible and exists (select 1 from public.profiles p where p.id = profile_id and p.username is not null)
);
drop policy if exists "embeds_owner_all" on public.profile_embeds;
create policy "embeds_owner_all" on public.profile_embeds for all using (auth.uid() = profile_id);

-- Featured blocks
drop policy if exists "featured_public_read" on public.featured_blocks;
create policy "featured_public_read" on public.featured_blocks for select using (
  is_enabled and exists (select 1 from public.profiles p where p.id = profile_id and p.username is not null)
);
drop policy if exists "featured_owner_all" on public.featured_blocks;
create policy "featured_owner_all" on public.featured_blocks for all using (auth.uid() = profile_id);

-- Guestbook entries
drop policy if exists "guestbook_read_approved" on public.guestbook_entries;
create policy "guestbook_read_approved" on public.guestbook_entries for select using (
  is_approved and exists (select 1 from public.profiles p where p.id = profile_id and p.username is not null)
);
drop policy if exists "guestbook_owner_read_all" on public.guestbook_entries;
create policy "guestbook_owner_read_all" on public.guestbook_entries for select using (auth.uid() = profile_id);
drop policy if exists "guestbook_insert_auth" on public.guestbook_entries;
create policy "guestbook_insert_auth" on public.guestbook_entries for insert with check (auth.uid() = author_id);
drop policy if exists "guestbook_owner_update" on public.guestbook_entries;
create policy "guestbook_owner_update" on public.guestbook_entries for update using (auth.uid() = profile_id);
drop policy if exists "guestbook_owner_delete" on public.guestbook_entries;
create policy "guestbook_owner_delete" on public.guestbook_entries for delete using (auth.uid() = profile_id or auth.uid() = author_id);

-- Guestbook reactions
drop policy if exists "guestbook_reactions_read" on public.guestbook_reactions;
create policy "guestbook_reactions_read" on public.guestbook_reactions for select using (true);
drop policy if exists "guestbook_reactions_insert" on public.guestbook_reactions;
create policy "guestbook_reactions_insert" on public.guestbook_reactions for insert with check (auth.uid() = user_id);
drop policy if exists "guestbook_reactions_delete" on public.guestbook_reactions;
create policy "guestbook_reactions_delete" on public.guestbook_reactions for delete using (auth.uid() = user_id);

-- Guestbook bans
drop policy if exists "guestbook_bans_owner" on public.guestbook_bans;
create policy "guestbook_bans_owner" on public.guestbook_bans for all using (auth.uid() = profile_id);

-- Widgets
drop policy if exists "widgets_public_read" on public.profile_widgets;
create policy "widgets_public_read" on public.profile_widgets for select using (
  is_enabled and exists (select 1 from public.profiles p where p.id = profile_id and p.username is not null)
);
drop policy if exists "widgets_owner_all" on public.profile_widgets;
create policy "widgets_owner_all" on public.profile_widgets for all using (auth.uid() = profile_id);

-- Follows
drop policy if exists "follows_public_read" on public.follows;
create policy "follows_public_read" on public.follows for select using (true);
drop policy if exists "follows_insert" on public.follows;
create policy "follows_insert" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "follows_delete" on public.follows;
create policy "follows_delete" on public.follows for delete using (auth.uid() = follower_id);

-- Friend requests
drop policy if exists "friend_requests_participant" on public.friend_requests;
create policy "friend_requests_participant" on public.friend_requests for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
drop policy if exists "friend_requests_insert" on public.friend_requests;
create policy "friend_requests_insert" on public.friend_requests for insert with check (auth.uid() = sender_id);
drop policy if exists "friend_requests_update" on public.friend_requests;
create policy "friend_requests_update" on public.friend_requests for update using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- Friendships
drop policy if exists "friendships_public_read" on public.friendships;
create policy "friendships_public_read" on public.friendships for select using (true);
drop policy if exists "friendships_insert" on public.friendships;
create policy "friendships_insert" on public.friendships for insert with check (
  auth.uid() = user_a or auth.uid() = user_b
);
drop policy if exists "friendships_delete" on public.friendships;
create policy "friendships_delete" on public.friendships for delete using (
  auth.uid() = user_a or auth.uid() = user_b
);

-- Notifications
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert with check (
  auth.uid() = actor_id or auth.uid() = user_id
);

-- Activity
drop policy if exists "activity_public_read" on public.activity_events;
create policy "activity_public_read" on public.activity_events for select using (
  exists (select 1 from public.profiles p where p.id = profile_id and p.username is not null)
);
drop policy if exists "activity_owner_insert" on public.activity_events;
create policy "activity_owner_insert" on public.activity_events for insert with check (auth.uid() = profile_id);

-- Triggers
drop trigger if exists profile_embeds_updated_at on public.profile_embeds;
create trigger profile_embeds_updated_at before update on public.profile_embeds
  for each row execute function public.handle_updated_at();

drop trigger if exists featured_blocks_updated_at on public.featured_blocks;
create trigger featured_blocks_updated_at before update on public.featured_blocks
  for each row execute function public.handle_updated_at();

drop trigger if exists profile_widgets_updated_at on public.profile_widgets;
create trigger profile_widgets_updated_at before update on public.profile_widgets
  for each row execute function public.handle_updated_at();

notify pgrst, 'reload schema';
