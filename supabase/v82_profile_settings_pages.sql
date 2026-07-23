-- v82: Fix profile_settings so each content page can have its own settings row.
-- v80 added page_id but the original profile_id PRIMARY KEY blocked extra rows,
-- causing page editor saves to miss the page row or fail silently.

alter table public.profile_settings
  add column if not exists id uuid default gen_random_uuid();

update public.profile_settings
set id = gen_random_uuid()
where id is null;

alter table public.profile_settings
  alter column id set default gen_random_uuid();

alter table public.profile_settings
  alter column id set not null;

alter table public.profile_settings
  drop constraint if exists profile_settings_pkey;

alter table public.profile_settings
  add constraint profile_settings_pkey primary key (id);

create unique index if not exists profile_settings_default_page_idx
  on public.profile_settings (profile_id)
  where page_id is null;

create unique index if not exists profile_settings_sub_page_idx
  on public.profile_settings (profile_id, page_id)
  where page_id is not null;

-- Create settings rows for content pages that were created before this fix.
insert into public.profile_settings (profile_id, page_id, enter_gate_enabled)
select pp.profile_id, pp.id, false
from public.profile_pages pp
where not exists (
  select 1
  from public.profile_settings ps
  where ps.profile_id = pp.profile_id
    and ps.page_id = pp.id
);
