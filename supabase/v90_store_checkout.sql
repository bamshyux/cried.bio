-- cried.bio v90: Stripe Checkout store purchases + catalog sync
-- Self-contained: creates store tables if v87 was not applied yet.

-- ─── Purchases ledger (canonical checkout record) ───────────────────────────

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_checkout_session_id text not null,
  stripe_payment_intent text,
  stripe_product_id text,
  price_id text not null,
  product_slug text not null,
  product_name text not null,
  amount_paid integer not null check (amount_paid >= 0),
  currency text not null default 'usd',
  status text not null default 'completed' check (status in ('completed', 'refunded', 'failed')),
  fulfillment_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists purchases_stripe_session_uidx
  on public.purchases (stripe_checkout_session_id);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;

drop policy if exists "Users read own purchases" on public.purchases;
create policy "Users read own purchases"
on public.purchases for select
using (auth.uid() = user_id);

-- ─── Store catalog (from v87 — safe if already exists) ────────────────────────

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  icon text not null default '✦',
  price_cents integer not null default 0 check (price_cents >= 0),
  stripe_price_id text,
  stripe_product_id text,
  badge_label text check (badge_label is null or badge_label in ('Popular', 'New')),
  status text not null default 'active' check (status in ('active', 'archived', 'coming_soon')),
  is_giftable boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  fulfillment_key text not null,
  badge_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_products_status_sort_idx
  on public.store_products (status, sort_order, name);

alter table public.store_products
  add column if not exists stripe_product_id text;

create table if not exists public.store_purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid not null references public.profiles (id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.store_products (id) on delete set null,
  product_slug text not null,
  stripe_session_id text,
  amount_cents integer not null default 0,
  is_gift boolean not null default false,
  gift_message text,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists store_purchases_recipient_idx
  on public.store_purchases (recipient_profile_id, created_at desc);

create index if not exists store_purchases_buyer_idx
  on public.store_purchases (buyer_profile_id, created_at desc);

alter table public.store_products enable row level security;
alter table public.store_purchases enable row level security;

drop policy if exists "Public read active store products" on public.store_products;
create policy "Public read active store products"
on public.store_products for select
using (status in ('active', 'coming_soon') and is_visible = true);

drop policy if exists "Admins manage store products" on public.store_products;
create policy "Admins manage store products"
on public.store_products for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Users read own store purchases" on public.store_purchases;
create policy "Users read own store purchases"
on public.store_purchases for select
using (auth.uid() = buyer_profile_id or auth.uid() = recipient_profile_id);

-- Archive legacy catalog items not in the new Stripe store
update public.store_products
set status = 'archived', is_visible = false, updated_at = now()
where slug not in (
  'custom-badge-1',
  'verified-badge',
  'custom-badges-3',
  'animated-badge',
  'support-1',
  'support-2',
  'support-5',
  'support-10'
);

insert into public.store_products (
  slug, name, description, features, icon, price_cents, stripe_product_id, stripe_price_id,
  badge_label, status, is_giftable, is_visible, sort_order, fulfillment_key, badge_slug
) values
  (
    'custom-badge-1',
    '1 Custom Badge',
    'Commission a unique badge designed for your profile.',
    '["One custom badge design", "Shown on your public profile", "Crafted by the cried.bio team"]'::jsonb,
    '✦', 0, 'prod_UwFJWSv6PIMg9C', 'price_1TwMobCZc2iqkh61qdNuBGk2',
    null, 'active', false, true, 10, 'custom_badge_1', null
  ),
  (
    'verified-badge',
    'Verified Badge',
    'Official verification badge with increased trust on your profile.',
    '["Verified badge on your profile", "Increased trust and credibility", "Premium badge included if needed"]'::jsonb,
    '✓', 0, 'prod_UwqcyeUYdobfCb', 'price_1Twwv1CZc2iqkh61DgApIM3H',
    'Popular', 'active', false, true, 20, 'verified_badge', 'verified'
  ),
  (
    'custom-badges-3',
    '3 Custom Badges',
    'Three custom badge designs for your profile.',
    '["Three unique badge designs", "Mix styles and themes", "Crafted by the cried.bio team"]'::jsonb,
    '★', 0, 'prod_Uwqf6eE4bTsJC2', 'price_1TwwxpCZc2iqkh61AQth3Daf',
    null, 'active', false, true, 30, 'custom_badges_3', null
  ),
  (
    'animated-badge',
    'Animated Badge',
    'A custom animated badge with motion effects for your profile.',
    '["Custom animated badge design", "Motion effects on your profile", "Crafted by the cried.bio team"]'::jsonb,
    '◈', 0, 'prod_UwqjCw4XFPfqS1', 'price_1Twx1mCZc2iqkh61bJ5rlvzD',
    'New', 'active', false, true, 40, 'animated_badge', null
  ),
  (
    'support-1',
    'Support cried.bio ($1)',
    'Help keep cried.bio running and unlock the Donor badge.',
    '["Donor badge on your profile", "Supports cried.bio development"]'::jsonb,
    '♥', 0, 'prod_Uwquo0kqIHm54X', 'price_1TwxCGCZc2iqkh61xHPJuO4G',
    null, 'active', false, true, 100, 'support_donation', 'donor'
  ),
  (
    'support-2',
    'Support cried.bio ($2)',
    'Help keep cried.bio running and unlock the Donor badge.',
    '["Donor badge on your profile", "Supports cried.bio development"]'::jsonb,
    '♥', 0, 'prod_UwquIZpZArqqrl', 'price_1TwxCaCZc2iqkh616kx3dT3I',
    null, 'active', false, true, 110, 'support_donation', 'donor'
  ),
  (
    'support-5',
    'Support cried.bio ($5)',
    'Help keep cried.bio running and unlock the Donor badge.',
    '["Donor badge on your profile", "Supports cried.bio development"]'::jsonb,
    '♥', 0, 'prod_Uwqyd84oibRfYQ', 'price_1TwxGwCZc2iqkh61ipJKleHn',
    null, 'active', false, true, 120, 'support_donation', 'donor'
  ),
  (
    'support-10',
    'Support cried.bio ($10)',
    'Help keep cried.bio running and unlock the Donor badge.',
    '["Donor badge on your profile", "Supports cried.bio development"]'::jsonb,
    '♥', 0, 'prod_UwqzO7zmHFErYH', 'price_1TwxHrCZc2iqkh61p0YtDOMT',
    null, 'active', false, true, 130, 'support_donation', 'donor'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  features = excluded.features,
  icon = excluded.icon,
  stripe_product_id = excluded.stripe_product_id,
  stripe_price_id = excluded.stripe_price_id,
  badge_label = excluded.badge_label,
  status = 'active',
  is_giftable = excluded.is_giftable,
  is_visible = true,
  sort_order = excluded.sort_order,
  fulfillment_key = excluded.fulfillment_key,
  badge_slug = excluded.badge_slug,
  updated_at = now();
