-- cried.bio v91: Store-purchased custom badge creation credits
-- Run after v90_store_checkout.sql

create table if not exists public.store_badge_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  credit_type text not null check (credit_type in ('static_single', 'static_triple', 'animated_single')),
  slots_total integer not null check (slots_total > 0),
  slots_used integer not null default 0 check (slots_used >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint store_badge_credits_slots_check check (slots_used <= slots_total)
);

create unique index if not exists store_badge_credits_purchase_uidx
  on public.store_badge_credits (purchase_id);

create index if not exists store_badge_credits_user_active_idx
  on public.store_badge_credits (user_id, credit_type)
  where slots_used < slots_total;

alter table public.store_badge_credits enable row level security;

drop policy if exists "Users read own badge credits" on public.store_badge_credits;
create policy "Users read own badge credits"
on public.store_badge_credits for select
using (auth.uid() = user_id);

-- Track which badges were created from store credits (service role writes only)
create table if not exists public.store_badge_creations (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.store_badge_credits (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists store_badge_creations_credit_idx
  on public.store_badge_creations (credit_id, created_at);

alter table public.store_badge_creations enable row level security;

drop policy if exists "Users read own badge creations" on public.store_badge_creations;
create policy "Users read own badge creations"
on public.store_badge_creations for select
using (auth.uid() = user_id);

-- Backfill credits for purchases made before this migration
insert into public.store_badge_credits (user_id, purchase_id, credit_type, slots_total, slots_used)
select
  p.user_id,
  p.id,
  case p.fulfillment_key
    when 'custom_badge_1' then 'static_single'
    when 'custom_badges_3' then 'static_triple'
    when 'animated_badge' then 'animated_single'
  end,
  case p.fulfillment_key when 'custom_badges_3' then 3 else 1 end,
  0
from public.purchases p
where p.fulfillment_key in ('custom_badge_1', 'custom_badges_3', 'animated_badge')
  and p.status = 'completed'
on conflict (purchase_id) do nothing;

notify pgrst, 'reload schema';
