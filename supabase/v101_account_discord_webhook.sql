-- Track Discord new-account webhook delivery (one per user)
alter table public.profiles
  add column if not exists discord_created_webhook_sent_at timestamptz;

create index if not exists profiles_discord_created_webhook_idx
  on public.profiles (discord_created_webhook_sent_at)
  where discord_created_webhook_sent_at is not null;

notify pgrst, 'reload schema';
