-- cried.bio v3: extended effects, analytics indexes, featured links
-- Safe to re-run

-- Extended settings columns
alter table public.profile_settings add column if not exists overlay_opacity integer not null default 40;
alter table public.profile_settings add column if not exists vignette boolean not null default false;
alter table public.profile_settings add column if not exists noise_texture boolean not null default false;
alter table public.profile_settings add column if not exists cursor_effect text not null default 'none';
alter table public.profile_settings add column if not exists username_effect text not null default 'none';
alter table public.profile_settings add column if not exists show_view_count boolean not null default true;
alter table public.profile_settings add column if not exists show_join_date boolean not null default true;
alter table public.profile_settings add column if not exists profile_status text not null default '';
alter table public.profile_settings add column if not exists featured_link_id uuid references public.links (id) on delete set null;
alter table public.profile_settings add column if not exists music_title text not null default '';

-- Drop old particle check if exists (expand effect list)
alter table public.profile_settings drop constraint if exists profile_settings_particle_effect_check;

-- Featured link on links table
alter table public.links add column if not exists is_featured boolean not null default false;

-- Analytics dedup index
create index if not exists analytics_events_dedup_idx
  on public.analytics_events (profile_id, event_type, visitor_hash, created_at desc);

-- Migrate legacy cursor_trail / username_glow if columns exist
do $$ begin
  update public.profile_settings
  set cursor_effect = 'trail'
  where cursor_trail = true and cursor_effect = 'none';
exception when undefined_column then null;
end $$;

do $$ begin
  update public.profile_settings
  set username_effect = 'glow'
  where username_glow = true and username_effect = 'none';
exception when undefined_column then null;
end $$;
