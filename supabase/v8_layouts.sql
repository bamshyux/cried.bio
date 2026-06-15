-- BioForge v8: Additional profile layouts
-- Run in Supabase Dashboard → SQL Editor

alter table public.profile_settings drop constraint if exists profile_settings_layout_check;

alter table public.profile_settings add constraint profile_settings_layout_check
  check (layout in (
    'classic', 'modern', 'gaming', 'portfolio', 'minimal',
    'stacked', 'split', 'terminal', 'compact', 'card', 'neon', 'magazine', 'bento'
  ));

notify pgrst, 'reload schema';
