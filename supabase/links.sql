-- cried.bio dynamic links schema
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Links table
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text not null,
  icon text default '🔗' not null,
  color text default '#ffffff' not null,
  background_color text default 'rgba(255,255,255,0.05)' not null,
  animation text default 'none' not null,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null,
  constraint links_title_not_empty check (char_length(trim(title)) > 0),
  constraint links_url_not_empty check (char_length(trim(url)) > 0),
  constraint links_animation_check check (animation in ('none', 'pulse', 'bounce', 'glow', 'slide'))
);

create index if not exists links_profile_id_idx on public.links (profile_id);
create index if not exists links_profile_sort_idx on public.links (profile_id, sort_order);

-- 2. Row Level Security
alter table public.links enable row level security;

drop policy if exists "Links are publicly readable for published profiles" on public.links;
create policy "Links are publicly readable for published profiles"
on public.links
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = links.profile_id
      and profiles.username is not null
  )
);

drop policy if exists "Users can view their own links" on public.links;
create policy "Users can view their own links"
on public.links
for select
using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own links" on public.links;
create policy "Users can insert their own links"
on public.links
for insert
with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own links" on public.links;
create policy "Users can update their own links"
on public.links
for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "Users can delete their own links" on public.links;
create policy "Users can delete their own links"
on public.links
for delete
using (auth.uid() = profile_id);

-- 3. Remove legacy hardcoded social columns from profiles (optional migration)
alter table public.profiles drop column if exists discord;
alter table public.profiles drop column if exists youtube;
alter table public.profiles drop column if exists twitch;
alter table public.profiles drop column if exists tiktok;
alter table public.profiles drop column if exists twitter;
