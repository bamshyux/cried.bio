-- cried.bio v87: Premium Store (one-time products, gifts, entitlements)

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  icon text not null default '✦',
  price_cents integer not null default 0 check (price_cents >= 0),
  stripe_price_id text,
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

create table if not exists public.profile_store_entitlements (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  extra_profile_pages integer not null default 0 check (extra_profile_pages >= 0),
  custom_badge_slots integer not null default 0 check (custom_badge_slots >= 0),
  can_create_custom_badge boolean not null default false,
  theme_pack_unlocked boolean not null default false,
  supporter_pack_active boolean not null default false,
  profile_boost_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.store_products enable row level security;
alter table public.store_purchases enable row level security;
alter table public.profile_store_entitlements enable row level security;

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

drop policy if exists "Users read own store entitlements" on public.profile_store_entitlements;
create policy "Users read own store entitlements"
on public.profile_store_entitlements for select
using (auth.uid() = profile_id);

-- Store badges
insert into public.badges (slug, name, icon, color, description, category, rarity, sort_order, is_assignable)
values
  ('gifter', 'Gifter', 'gifter', '#f472b6', 'Gifted Premium or Store items to another creator.', 'supporter', 'legendary', 5, false),
  ('supporter', 'Supporter', '♥', '#fafafa', 'Supports cried.bio development.', 'supporter', 'epic', 6, false)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  category = excluded.category,
  rarity = excluded.rarity,
  is_assignable = excluded.is_assignable;

-- Seed store catalog
insert into public.store_products (
  slug, name, description, features, icon, price_cents, badge_label, status, sort_order, fulfillment_key, badge_slug
) values
  (
    'custom-badge',
    'Custom Badge',
    'Create and display your own badge on your public profile.',
    '["Custom icon", "Custom badge name", "Shown on your profile", "Editable later"]'::jsonb,
    '✦',
    499,
    null,
    'active',
    10,
    'custom_badge',
    null
  ),
  (
    'verified-badge',
    'Verified Badge',
    'Official verification with increased trust and a special profile appearance.',
    '["Official Verified badge", "Increased trust", "Includes Premium badge if needed", "Special profile appearance"]'::jsonb,
    '✓',
    1499,
    'Popular',
    'active',
    20,
    'verified_badge',
    'verified'
  ),
  (
    'username-reservation',
    'Username Reservation',
    'Reserve a username forever — even if you change names later, nobody else can claim it.',
    '["Permanent reservation", "Survives username changes", "Exclusive to your account"]'::jsonb,
    '@',
    999,
    null,
    'active',
    30,
    'username_reservation',
    null
  ),
  (
    'profile-boost',
    'Profile Boost',
    'Feature your profile in Trending, Featured Profiles, and Explore for a limited time.',
    '["Trending placement", "Featured Profiles spotlight", "Explore visibility", "7-day boost"]'::jsonb,
    '🚀',
    799,
    'New',
    'active',
    40,
    'profile_boost',
    null
  ),
  (
    'extra-profile-page',
    'Extra Profile Page',
    'Permanently unlock one additional profile page without a Premium subscription.',
    '["One permanent page slot", "Great for galleries or FAQs", "Stacks with Premium pages"]'::jsonb,
    '📄',
    399,
    null,
    'active',
    50,
    'extra_profile_page',
    null
  ),
  (
    'custom-badge-slot',
    'Additional Custom Badge Slot',
    'Display multiple custom badges on your profile at once.',
    '["Extra custom badge slot", "Stack with Custom Badge", "Show more personality"]'::jsonb,
    '★',
    299,
    null,
    'active',
    60,
    'custom_badge_slot',
    null
  ),
  (
    'theme-pack',
    'Profile Theme Pack',
    'Unlock exclusive premium themes forever on your account.',
    '["Exclusive theme collection", "Permanent unlock", "Premium-only styles"]'::jsonb,
    '🎨',
    699,
    null,
    'active',
    70,
    'theme_pack',
    null
  ),
  (
    'supporter-pack',
    'Supporter Pack',
    'Purely cosmetic — support cried.bio development and stand out.',
    '["Exclusive Supporter badge", "Special profile accent", "Support development"]'::jsonb,
    '♥',
    499,
    null,
    'active',
    80,
    'supporter_pack',
    'supporter'
  ),
  (
    'animated-badge-frames',
    'Animated Badge Frames',
    'Animated frames around your profile badges.',
    '[]'::jsonb,
    '◈',
    0,
    null,
    'coming_soon',
    100,
    'coming_soon',
    null
  ),
  (
    'animated-username',
    'Animated Username',
    'Motion effects for your display name.',
    '[]'::jsonb,
    'Aa',
    0,
    null,
    'coming_soon',
    110,
    'coming_soon',
    null
  ),
  (
    'profile-pets',
    'Profile Pets',
    'Cute companions that live on your profile.',
    '[]'::jsonb,
    '🐾',
    0,
    null,
    'coming_soon',
    120,
    'coming_soon',
    null
  ),
  (
    'profile-particles',
    'Profile Particles',
    'Premium particle overlays for your page.',
    '[]'::jsonb,
    '✨',
    0,
    null,
    'coming_soon',
    130,
    'coming_soon',
    null
  ),
  (
    'creator-packs',
    'Creator Packs',
    'Bundled cosmetics and tools for creators.',
    '[]'::jsonb,
    '📦',
    0,
    null,
    'coming_soon',
    140,
    'coming_soon',
    null
  ),
  (
    'seasonal-cosmetics',
    'Seasonal Cosmetics',
    'Limited seasonal profile cosmetics.',
    '[]'::jsonb,
    '🎃',
    0,
    null,
    'coming_soon',
    150,
    'coming_soon',
    null
  ),
  (
    'limited-edition-badges',
    'Limited Edition Badges',
    'Rare badges with limited availability.',
    '[]'::jsonb,
    '🏆',
    0,
    null,
    'coming_soon',
    160,
    'coming_soon',
    null
  ),
  (
    'community-theme-packs',
    'Community Theme Packs',
    'Curated theme packs from the community.',
    '[]'::jsonb,
    '🌐',
    0,
    null,
    'coming_soon',
    170,
    'coming_soon',
    null
  )
on conflict (slug) do nothing;
