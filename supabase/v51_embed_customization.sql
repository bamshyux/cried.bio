-- Per-embed customization (layout, colors, Roblox avatar, player options, etc.)
alter table public.profile_embeds
  add column if not exists config jsonb not null default '{}';
