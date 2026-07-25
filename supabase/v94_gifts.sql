-- cried.bio v94: Gifting system

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete set null,
  reference_id text not null,
  product_id uuid references public.store_products (id) on delete set null,
  product_slug text not null,
  product_name text not null,
  gift_message text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded')),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists gifts_reference_id_uidx on public.gifts (reference_id);
create index if not exists gifts_sender_idx on public.gifts (sender_user_id, created_at desc);
create index if not exists gifts_recipient_idx on public.gifts (recipient_user_id, created_at desc);
create index if not exists gifts_purchase_idx on public.gifts (purchase_id);

alter table public.gifts enable row level security;

drop policy if exists "Users read own gifts" on public.gifts;
create policy "Users read own gifts"
on public.gifts for select
using (auth.uid() = sender_user_id or auth.uid() = recipient_user_id);

-- Enable gifting on eligible store products (not support donations)
update public.store_products
set is_giftable = true, updated_at = now()
where slug in (
  'custom-badge-1',
  'verified-badge',
  'custom-badges-3',
  'animated-badge'
);

update public.store_products
set is_giftable = false, updated_at = now()
where slug like 'support-%';

notify pgrst, 'reload schema';
