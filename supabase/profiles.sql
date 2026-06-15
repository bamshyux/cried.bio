-- cried.bio profiles schema
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  uid bigint unique,
  username text unique,
  display_name text default '' not null,
  bio text default '' not null,
  avatar_url text,
  banner_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,20}$'
  )
);

create index if not exists profiles_username_idx on public.profiles (username);

-- 2. Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

-- 3. Row Level Security
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
on public.profiles
for select
using (username is not null);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow users to read their own profile even before username is set
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

-- 4. Storage bucket for avatar & banner images
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do update set public = true;

-- 5. Storage policies
drop policy if exists "Profile images are publicly accessible" on storage.objects;
create policy "Profile images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'profiles');

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
on storage.objects
for insert
with check (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own profile images" on storage.objects;
create policy "Users can update their own profile images"
on storage.objects
for update
using (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images"
on storage.objects
for delete
using (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
);
