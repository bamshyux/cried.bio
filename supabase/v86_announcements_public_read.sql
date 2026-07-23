-- cried.bio v86: Public read access for sitewide announcements + platform banner settings
-- Run in Supabase Dashboard → SQL Editor (after v85)

alter table public.announcements enable row level security;

drop policy if exists "Public read active announcements" on public.announcements;
create policy "Public read active announcements"
  on public.announcements
  for select
  using (is_active = true);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

alter table public.platform_settings enable row level security;

drop policy if exists "Public read platform settings" on public.platform_settings;
create policy "Public read platform settings"
  on public.platform_settings
  for select
  using (true);

drop policy if exists "Owner update platform settings" on public.platform_settings;
create policy "Owner update platform settings"
  on public.platform_settings
  for update
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

notify pgrst, 'reload schema';
