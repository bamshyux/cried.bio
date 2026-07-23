-- v85: Toggle visibility of the public profile music player control

alter table public.profile_settings
  add column if not exists music_show_player boolean not null default true;

comment on column public.profile_settings.music_show_player is
  'When false, hide the bottom-right play/pause music player UI (audio may still autoplay)';
