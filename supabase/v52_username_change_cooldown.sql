-- Username change cooldown (7 days between changes)
alter table public.profiles
  add column if not exists username_changed_at timestamptz;

comment on column public.profiles.username_changed_at is
  'Timestamp of the last username change; users may change username once every 7 days.';
