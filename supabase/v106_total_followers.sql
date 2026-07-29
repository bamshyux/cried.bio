-- cried.bio v106: Total Followers — aggregate social link follower counts

alter table public.profile_settings
  add column if not exists show_total_followers boolean not null default false;

comment on column public.profile_settings.show_total_followers is
  'Show aggregated follower count from linked social platforms on the public profile';

create table if not exists public.link_platform_stats (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  platform_username text,
  display_name text,
  avatar_url text,
  follower_count bigint,
  count_label text not null default 'Followers',
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (link_id)
);

create index if not exists link_platform_stats_profile_idx
  on public.link_platform_stats (profile_id, platform);

drop trigger if exists link_platform_stats_updated_at on public.link_platform_stats;
create trigger link_platform_stats_updated_at
before update on public.link_platform_stats
for each row execute function public.handle_updated_at();

alter table public.link_platform_stats enable row level security;

drop policy if exists "link_platform_stats_select_public" on public.link_platform_stats;
create policy "link_platform_stats_select_public"
on public.link_platform_stats
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.username is not null
  )
);

drop policy if exists "link_platform_stats_manage_own" on public.link_platform_stats;
create policy "link_platform_stats_manage_own"
on public.link_platform_stats
for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

notify pgrst, 'reload schema';
