-- cried.bio v7: Custom badge images + badge color customization
-- Run in Supabase Dashboard → SQL Editor (after v5_badges.sql)

-- Custom badge image URL (admin-uploaded icons)
alter table public.badges add column if not exists icon_url text;

comment on column public.badges.icon_url is 'Optional uploaded image URL for custom badges';

-- User badge color preferences (monochrome / custom tint)
alter table public.profile_settings
  add column if not exists badges_monochrome boolean not null default false;

alter table public.profile_settings
  add column if not exists badge_color text not null default '#ffffff';

comment on column public.profile_settings.badges_monochrome is 'When true, all badges use badge_color instead of their catalog colors';
comment on column public.profile_settings.badge_color is 'Color applied to all badges when badges_monochrome is enabled';

-- Storage bucket for custom badge images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'badges',
  'badges',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

drop policy if exists "Badge images are publicly accessible" on storage.objects;
create policy "Badge images are publicly accessible"
on storage.objects for select
using (bucket_id = 'badges');

drop policy if exists "Admins can upload badge images" on storage.objects;
create policy "Admins can upload badge images"
on storage.objects for insert
with check (
  bucket_id = 'badges'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can update badge images" on storage.objects;
create policy "Admins can update badge images"
on storage.objects for update
using (
  bucket_id = 'badges'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete badge images" on storage.objects;
create policy "Admins can delete badge images"
on storage.objects for delete
using (
  bucket_id = 'badges'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

notify pgrst, 'reload schema';
