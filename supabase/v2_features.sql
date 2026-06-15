-- cried.bio v2: Advanced customization, badges, analytics, storage
-- Run in Supabase Dashboard → SQL Editor (after profiles.sql + links.sql)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS throughout.

-- ─── 0. Prerequisite: admin column (must exist before badge policies) ────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- To grant admin access (run once for your account):
-- update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';

-- ─── 1. Profile settings ──────────────────────────────────────────────────────

create table if not exists public.profile_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,

  layout text not null default 'classic'
    check (layout in ('classic', 'modern', 'gaming', 'portfolio', 'minimal')),

  accent_color text not null default '#8b5cf6',
  text_color text not null default '#ffffff',
  background_color text not null default '#050508',
  font_family text not null default 'inter',

  animated_gradient boolean not null default false,
  gradient_colors jsonb not null default '["#8b5cf6", "#d946ef", "#06b6d4"]'::jsonb,
  glassmorphism boolean not null default true,
  neon_glow boolean not null default false,
  border_radius integer not null default 16
    check (border_radius between 0 and 48),
  profile_opacity integer not null default 85
    check (profile_opacity between 0 and 100),
  profile_blur integer not null default 12
    check (profile_blur between 0 and 40),

  background_type text not null default 'animated_gradient'
    check (background_type in ('solid', 'image', 'video', 'animated_gradient', 'particles')),
  background_image_url text,
  background_video_url text,
  particle_effect text
    check (particle_effect is null or particle_effect in ('snow', 'rain', 'floating', 'starfield')),

  music_url text,
  music_autoplay boolean not null default false,
  music_loop boolean not null default true,
  music_volume integer not null default 50
    check (music_volume between 0 and 100),

  cursor_trail boolean not null default false,
  typing_bio boolean not null default false,
  username_glow boolean not null default false,
  hover_animations boolean not null default true,
  page_entrance boolean not null default true,
  link_animation text not null default 'none'
    check (link_animation in ('none', 'pulse', 'bounce', 'glow', 'slide')),

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists profile_settings_updated_at on public.profile_settings;
create trigger profile_settings_updated_at
before update on public.profile_settings
for each row execute function public.handle_updated_at();

alter table public.profile_settings enable row level security;

drop policy if exists "Published profile settings are public" on public.profile_settings;
create policy "Published profile settings are public"
on public.profile_settings for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = profile_settings.profile_id
      and profiles.username is not null
  )
);

drop policy if exists "Users can view own settings" on public.profile_settings;
create policy "Users can view own settings"
on public.profile_settings for select
using (auth.uid() = profile_id);

drop policy if exists "Users can insert own settings" on public.profile_settings;
create policy "Users can insert own settings"
on public.profile_settings for insert
with check (auth.uid() = profile_id);

drop policy if exists "Users can update own settings" on public.profile_settings;
create policy "Users can update own settings"
on public.profile_settings for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- ─── 2. Extend links ─────────────────────────────────────────────────────────

alter table public.links add column if not exists color text default '#ffffff' not null;
alter table public.links add column if not exists background_color text default 'rgba(255,255,255,0.05)' not null;
alter table public.links add column if not exists animation text default 'none' not null;

do $$ begin
  alter table public.links add constraint links_animation_check
    check (animation in ('none', 'pulse', 'bounce', 'glow', 'slide'));
exception when duplicate_object then null;
end $$;

-- ─── 3. Badges ───────────────────────────────────────────────────────────────

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text not null default '⭐',
  color text not null default '#8b5cf6',
  description text default '' not null,
  is_system boolean not null default true,
  created_at timestamptz default now() not null
);

insert into public.badges (slug, name, icon, color, description, is_system) values
  ('verified', 'Verified', '✓', '#3b82f6', 'Verified account', true),
  ('premium', 'Premium', '👑', '#f59e0b', 'Premium member', true),
  ('early_adopter', 'Early Adopter', '🚀', '#10b981', 'Joined during early access', true),
  ('developer', 'Developer', '⚡', '#8b5cf6', 'cried.bio developer', true)
on conflict (slug) do nothing;

create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz default now() not null,
  unique (profile_id, badge_id)
);

create index if not exists profile_badges_profile_idx on public.profile_badges (profile_id);

alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;

-- Badge policies (is_admin column guaranteed to exist from step 0)
drop policy if exists "Badges are publicly readable" on public.badges;
create policy "Badges are publicly readable"
on public.badges for select using (true);

drop policy if exists "Admins can create custom badges" on public.badges;
create policy "Admins can create custom badges"
on public.badges for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Profile badges public for published profiles" on public.profile_badges;
create policy "Profile badges public for published profiles"
on public.profile_badges for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = profile_badges.profile_id
      and profiles.username is not null
  )
);

drop policy if exists "Users can view own badges" on public.profile_badges;
create policy "Users can view own badges"
on public.profile_badges for select
using (auth.uid() = profile_id);

drop policy if exists "Admins can assign badges" on public.profile_badges;
create policy "Admins can assign badges"
on public.profile_badges for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can remove badges" on public.profile_badges;
create policy "Admins can remove badges"
on public.profile_badges for delete
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

-- ─── 4. Analytics ─────────────────────────────────────────────────────────────

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('profile_view', 'link_click')),
  link_id uuid references public.links (id) on delete set null,
  visitor_hash text not null,
  country text default 'Unknown' not null,
  created_at timestamptz default now() not null
);

create index if not exists analytics_events_profile_date_idx
  on public.analytics_events (profile_id, created_at desc);
create index if not exists analytics_events_profile_type_idx
  on public.analytics_events (profile_id, event_type);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events"
on public.analytics_events for insert
with check (true);

drop policy if exists "Users can view own analytics" on public.analytics_events;
create policy "Users can view own analytics"
on public.analytics_events for select
using (auth.uid() = profile_id);

-- ─── 5. Storage: backgrounds & music ────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backgrounds',
  'backgrounds',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music',
  'music',
  true,
  20971520,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

-- Backgrounds storage policies
drop policy if exists "Background files are publicly accessible" on storage.objects;
create policy "Background files are publicly accessible"
on storage.objects for select using (bucket_id = 'backgrounds');

drop policy if exists "Users can upload own backgrounds" on storage.objects;
create policy "Users can upload own backgrounds"
on storage.objects for insert
with check (
  bucket_id = 'backgrounds'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own backgrounds" on storage.objects;
create policy "Users can update own backgrounds"
on storage.objects for update
using (
  bucket_id = 'backgrounds'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own backgrounds" on storage.objects;
create policy "Users can delete own backgrounds"
on storage.objects for delete
using (
  bucket_id = 'backgrounds'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Music storage policies
drop policy if exists "Music files are publicly accessible" on storage.objects;
create policy "Music files are publicly accessible"
on storage.objects for select using (bucket_id = 'music');

drop policy if exists "Users can upload own music" on storage.objects;
create policy "Users can upload own music"
on storage.objects for insert
with check (
  bucket_id = 'music'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own music" on storage.objects;
create policy "Users can update own music"
on storage.objects for update
using (
  bucket_id = 'music'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own music" on storage.objects;
create policy "Users can delete own music"
on storage.objects for delete
using (
  bucket_id = 'music'
  and auth.uid()::text = (storage.foldername(name))[1]
);
