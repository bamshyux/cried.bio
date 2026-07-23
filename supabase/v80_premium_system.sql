-- cried.bio v80: Premium subscription system, entitlements, music playlists,
-- profile pages, preset schedules

-- ─── Premium subscriptions (Stripe sync) ─────────────────────────────────────
create table if not exists public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null default '',
  stripe_subscription_id text,
  stripe_price_id text not null default '',
  plan_name text not null default 'premium_lite',
  billing_type text not null check (billing_type in ('monthly', 'lifetime')),
  status text not null default 'active'
    check (status in ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'expired')),
  lifetime boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists premium_subscriptions_user_id_idx
  on public.premium_subscriptions(user_id);

create index if not exists premium_subscriptions_stripe_customer_idx
  on public.premium_subscriptions(stripe_customer_id)
  where stripe_customer_id <> '';

create index if not exists premium_subscriptions_stripe_sub_idx
  on public.premium_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.profiles
  add column if not exists stripe_customer_id text not null default '';

-- Expand premium_tier values (free | premium_lite | premium | premium_plus | creator | enterprise)
-- Legacy "premium" maps to premium_lite in application code.

-- ─── Music playlist ──────────────────────────────────────────────────────────
create table if not exists public.profile_music_tracks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  page_id uuid,
  url text not null,
  title text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_music_tracks_profile_idx
  on public.profile_music_tracks(profile_id, page_id, sort_order);

alter table public.profile_settings
  add column if not exists music_playlist_mode boolean not null default false;

alter table public.profile_settings
  add column if not exists music_shuffle boolean not null default false;

alter table public.profile_settings
  add column if not exists music_autoplay_next boolean not null default false;

alter table public.profile_settings
  add column if not exists music_default_track_id uuid;

alter table public.profile_settings
  add column if not exists last_applied_schedule_id uuid;

alter table public.profile_settings
  add column if not exists page_id uuid;

alter table public.profile_settings
  add column if not exists active_edit_page_id uuid;

-- ─── Additional profile pages ────────────────────────────────────────────────
create table if not exists public.profile_pages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9_-]{1,30}$'),
  label text not null default '',
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  banner_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, slug)
);

create index if not exists profile_pages_profile_idx on public.profile_pages(profile_id, sort_order);

alter table public.profile_music_tracks
  add constraint profile_music_tracks_page_id_fkey
  foreign key (page_id) references public.profile_pages(id) on delete cascade;

alter table public.profile_settings
  add constraint profile_settings_page_id_fkey
  foreign key (page_id) references public.profile_pages(id) on delete cascade;

alter table public.profile_settings
  add constraint profile_settings_active_edit_page_id_fkey
  foreign key (active_edit_page_id) references public.profile_pages(id) on delete set null;

alter table public.links
  add column if not exists page_id uuid references public.profile_pages(id) on delete cascade;

alter table public.profile_embeds
  add column if not exists page_id uuid references public.profile_pages(id) on delete cascade;

alter table public.featured_blocks
  add column if not exists page_id uuid references public.profile_pages(id) on delete cascade;

create index if not exists links_page_id_idx on public.links(profile_id, page_id, sort_order);
create index if not exists profile_embeds_page_id_idx on public.profile_embeds(profile_id, page_id, sort_order);
create index if not exists featured_blocks_page_id_idx on public.featured_blocks(profile_id, page_id, sort_order);

-- Allow sub-page settings rows (primary page keeps page_id null)
create unique index if not exists profile_settings_default_page_idx
  on public.profile_settings(profile_id) where page_id is null;

create unique index if not exists profile_settings_sub_page_idx
  on public.profile_settings(profile_id, page_id) where page_id is not null;

-- ─── Scheduled preset swaps ──────────────────────────────────────────────────
create table if not exists public.profile_preset_schedules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  page_id uuid references public.profile_pages(id) on delete cascade,
  preset_id uuid not null references public.profile_presets(id) on delete cascade,
  label text not null default '',
  start_time time not null,
  end_time time not null,
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}',
  timezone text not null default 'UTC',
  enabled boolean not null default true,
  priority int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_preset_schedules_profile_idx
  on public.profile_preset_schedules(profile_id, enabled, priority desc);

-- ─── Feature release stages (early access registry) ──────────────────────────
create table if not exists public.feature_release_flags (
  feature_key text primary key,
  release_stage text not null default 'general'
    check (release_stage in ('general', 'premium_early_access', 'premium_only')),
  label text not null default '',
  updated_at timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.premium_subscriptions enable row level security;
alter table public.profile_music_tracks enable row level security;
alter table public.profile_pages enable row level security;
alter table public.profile_preset_schedules enable row level security;
alter table public.feature_release_flags enable row level security;

create policy premium_subscriptions_owner_read on public.premium_subscriptions
  for select using (auth.uid() = user_id);

create policy profile_music_tracks_owner on public.profile_music_tracks
  for all using (auth.uid() = profile_id);

create policy profile_pages_owner on public.profile_pages
  for all using (auth.uid() = profile_id);

create policy profile_pages_public_read on public.profile_pages
  for select using (true);

create policy profile_preset_schedules_owner on public.profile_preset_schedules
  for all using (auth.uid() = profile_id);

create policy feature_release_flags_public_read on public.feature_release_flags
  for select using (true);

-- Migrate existing single-track music into playlist table
insert into public.profile_music_tracks (profile_id, url, title, sort_order)
select ps.profile_id, ps.music_url, coalesce(nullif(trim(ps.music_title), ''), 'Profile Track'), 0
from public.profile_settings ps
where ps.music_url is not null
  and ps.page_id is null
  and not exists (
    select 1 from public.profile_music_tracks t
    where t.profile_id = ps.profile_id and t.page_id is null
  );
