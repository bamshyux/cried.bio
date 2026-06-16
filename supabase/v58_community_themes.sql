-- cried.bio v58: Community theme marketplace

create table if not exists public.community_theme_listings (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.custom_themes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  category text not null default 'other'
    check (category in ('minimal', 'dark', 'colorful', 'gaming', 'professional', 'creative', 'retro', 'anime', 'other')),
  visibility text not null default 'private'
    check (visibility in ('private', 'public', 'open_source')),
  preview_image_url text,
  preview_style text not null default 'linear-gradient(135deg, #1a1a1a 0%, #333 50%, #111 100%)',
  like_count bigint not null default 0,
  install_count bigint not null default 0,
  is_staff_pick boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_id)
);

create index if not exists community_theme_listings_public_idx
  on public.community_theme_listings (published_at desc)
  where visibility in ('public', 'open_source');

create index if not exists community_theme_listings_installs_idx
  on public.community_theme_listings (install_count desc)
  where visibility in ('public', 'open_source');

create index if not exists community_theme_listings_likes_idx
  on public.community_theme_listings (like_count desc)
  where visibility in ('public', 'open_source');

create index if not exists community_theme_listings_author_idx
  on public.community_theme_listings (author_id, updated_at desc);

create table if not exists public.community_theme_likes (
  listing_id uuid not null references public.community_theme_listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create table if not exists public.community_theme_installs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.community_theme_listings(id) on delete cascade,
  installer_id uuid not null references public.profiles(id) on delete cascade,
  installed_theme_id uuid references public.custom_themes(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id, installer_id)
);

create index if not exists community_theme_installs_recent_idx
  on public.community_theme_installs (created_at desc);

create table if not exists public.community_theme_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.community_theme_listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'inappropriate', 'malicious', 'copyright', 'other')),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

-- Counters
create or replace function public.bump_community_theme_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.community_theme_listings
  set like_count = like_count + 1
  where id = new.listing_id;
  return new;
end; $$;

create or replace function public.drop_community_theme_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.community_theme_listings
  set like_count = greatest(0, like_count - 1)
  where id = old.listing_id;
  return old;
end; $$;

drop trigger if exists community_theme_likes_bump on public.community_theme_likes;
create trigger community_theme_likes_bump
after insert on public.community_theme_likes
for each row execute function public.bump_community_theme_like_count();

drop trigger if exists community_theme_likes_drop on public.community_theme_likes;
create trigger community_theme_likes_drop
after delete on public.community_theme_likes
for each row execute function public.drop_community_theme_like_count();

create or replace function public.bump_community_theme_install_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.community_theme_listings
  set install_count = install_count + 1
  where id = new.listing_id;
  return new;
end; $$;

drop trigger if exists community_theme_installs_bump on public.community_theme_installs;
create trigger community_theme_installs_bump
after insert on public.community_theme_installs
for each row execute function public.bump_community_theme_install_count();

drop trigger if exists community_theme_listings_updated_at on public.community_theme_listings;
create trigger community_theme_listings_updated_at
before update on public.community_theme_listings
for each row execute function public.handle_updated_at();

alter table public.community_theme_listings enable row level security;
alter table public.community_theme_likes enable row level security;
alter table public.community_theme_installs enable row level security;
alter table public.community_theme_reports enable row level security;

drop policy if exists "community_theme_listings_public_read" on public.community_theme_listings;
create policy "community_theme_listings_public_read" on public.community_theme_listings
for select using (
  visibility in ('public', 'open_source')
  or auth.uid() = author_id
);

drop policy if exists "community_theme_listings_owner_write" on public.community_theme_listings;
create policy "community_theme_listings_owner_write" on public.community_theme_listings
for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "community_theme_likes_read" on public.community_theme_likes;
create policy "community_theme_likes_read" on public.community_theme_likes for select using (true);

drop policy if exists "community_theme_likes_own" on public.community_theme_likes;
create policy "community_theme_likes_own" on public.community_theme_likes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "community_theme_installs_read" on public.community_theme_installs;
create policy "community_theme_installs_read" on public.community_theme_installs
for select using (auth.uid() = installer_id);

drop policy if exists "community_theme_installs_insert" on public.community_theme_installs;
create policy "community_theme_installs_insert" on public.community_theme_installs
for insert with check (auth.uid() = installer_id);

drop policy if exists "community_theme_reports_insert" on public.community_theme_reports;
create policy "community_theme_reports_insert" on public.community_theme_reports
for insert with check (auth.uid() = reporter_id);

drop policy if exists "community_theme_reports_own_read" on public.community_theme_reports;
create policy "community_theme_reports_own_read" on public.community_theme_reports
for select using (auth.uid() = reporter_id);

notify pgrst, 'reload schema';
