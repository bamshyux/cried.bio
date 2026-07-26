-- v97: Add animated premium layouts + ensure all premium layout slugs are allowed.

alter table public.profile_settings drop constraint if exists profile_settings_layout_check;

alter table public.profile_settings add constraint profile_settings_layout_check
  check (layout in (
    'classic', 'modern', 'gaming', 'portfolio', 'minimal',
    'stacked', 'split', 'terminal', 'compact', 'card', 'neon', 'magazine', 'bento',
    'sidebar', 'hero', 'polaroid', 'cinematic', 'showcase', 'retro', 'poster', 'glass',
    'vaporwave', 'brutalist', 'newspaper', 'ticket', 'vinyl', 'discord', 'twitch',
    'idcard', 'blueprint', 'comic', 'cyberpunk', 'luxury', 'receipt', 'zine', 'orbit',
    'wave', 'mosaic', 'aurora', 'hologram', 'spotify', 'spotlight',
    'monarch', 'glitch', 'noir', 'runway', 'arcade', 'passport', 'cassette', 'crystal',
    'nebuladrift', 'samurai', 'graffiti', 'monolith', 'prismstack', 'dashboard', 'command',
    'bloom', 'stealth', 'festival', 'manga', 'emberforge',
    'matrix', 'liquid', 'supernova', 'tapewave', 'phoenix',
    'custom'
  ));
