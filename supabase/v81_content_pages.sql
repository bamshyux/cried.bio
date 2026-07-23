-- cried.bio v81: Content pages (not duplicate profiles)
-- Additional pages are customizable content canvases with nav, icon, and publish state.

alter table public.profile_pages
  add column if not exists icon text not null default '';

alter table public.profile_pages
  add column if not exists published boolean not null default true;

create index if not exists profile_pages_published_idx
  on public.profile_pages(profile_id, published, sort_order);
