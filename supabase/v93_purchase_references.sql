-- cried.bio v93: Purchase reference IDs and billing metadata
-- Run after v92_store_purchase_grants.sql

alter table public.purchases
  add column if not exists reference_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists payment_method text,
  add column if not exists receipt_number text,
  add column if not exists invoice_number text;

create unique index if not exists purchases_reference_id_uidx
  on public.purchases (reference_id)
  where reference_id is not null;

create index if not exists purchases_reference_search_idx
  on public.purchases (reference_id);

create index if not exists purchases_created_status_idx
  on public.purchases (created_at desc, status);

-- Backfill reference IDs for existing purchases
update public.purchases
set reference_id = 'CRIED-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where reference_id is null;

alter table public.purchases
  alter column reference_id set not null;

notify pgrst, 'reload schema';
