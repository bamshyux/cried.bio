-- cried.bio v38: Content moderation (categories, banned words, logs, audit)

create table if not exists public.moderation_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_words (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.moderation_categories(id) on delete cascade,
  word text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, word)
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  content_type text not null,
  action text not null default 'blocked',
  category_slug text,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_logs_created_at_idx on public.moderation_logs (created_at desc);
create index if not exists moderation_audit_created_at_idx on public.moderation_audit (created_at desc);

alter table public.moderation_categories enable row level security;
alter table public.moderation_words enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.moderation_audit enable row level security;

insert into public.moderation_categories (slug, name, sort_order) values
  ('profanity', 'Profanity', 1),
  ('sexual', 'Sexual Content', 2),
  ('self_harm', 'Self Harm', 3),
  ('illegal', 'Illegal / Dangerous', 4),
  ('scam', 'Scam / Phishing', 5)
on conflict (slug) do nothing;

-- Seed banned words (idempotent)
insert into public.moderation_words (category_id, word)
select c.id, w.word
from public.moderation_categories c
cross join (values
  ('fuck'), ('fucking'), ('fucked'), ('shit'), ('shitty'), ('bitch'), ('bastard'),
  ('asshole'), ('dick'), ('penis'), ('pussy'), ('cunt'), ('whore'), ('slut'),
  ('motherfucker'), ('mf'), ('nigga'), ('nigger'), ('fag'), ('faggot'), ('retard'),
  ('retarded'), ('kike'), ('spic'), ('chink'), ('wetback')
) as w(word)
where c.slug = 'profanity'
on conflict (category_id, word) do nothing;

insert into public.moderation_words (category_id, word)
select c.id, w.word
from public.moderation_categories c
cross join (values
  ('porn'), ('pornography'), ('sexvideo'), ('onlyfans'), ('only fans'), ('nsfw'),
  ('nude'), ('nudes'), ('naked'), ('blowjob'), ('handjob'), ('gangbang'), ('anal'),
  ('sex'), ('sexting'), ('dildo'), ('vibrator')
) as w(word)
where c.slug = 'sexual'
on conflict (category_id, word) do nothing;

insert into public.moderation_words (category_id, word)
select c.id, w.word
from public.moderation_categories c
cross join (values
  ('kill yourself'), ('kys'), ('suicide'), ('self harm'), ('cut yourself'), ('hang yourself')
) as w(word)
where c.slug = 'self_harm'
on conflict (category_id, word) do nothing;

insert into public.moderation_words (category_id, word)
select c.id, w.word
from public.moderation_categories c
cross join (values
  ('dox'), ('doxx'), ('doxxing'), ('swat'), ('swatting'), ('ddos'), ('hitman'),
  ('child porn'), ('cp')
) as w(word)
where c.slug = 'illegal'
on conflict (category_id, word) do nothing;

insert into public.moderation_words (category_id, word)
select c.id, w.word
from public.moderation_categories c
cross join (values
  ('free nitro'), ('free robux'), ('discord nitro generator'), ('robux generator'),
  ('bitcoin giveaway'), ('crypto giveaway')
) as w(word)
where c.slug = 'scam'
on conflict (category_id, word) do nothing;

notify pgrst, 'reload schema';
