-- cried.bio v24: Click-to-enter gate (guns.lol style)

alter table public.profile_settings
  add column if not exists enter_gate_enabled boolean not null default true;

alter table public.profile_settings
  add column if not exists enter_gate_title text not null default '';

alter table public.profile_settings
  add column if not exists enter_gate_subtitle text not null default '';

alter table public.profile_settings
  add column if not exists enter_gate_button text not null default 'Click to enter';

alter table public.profile_settings
  add column if not exists enter_gate_show_avatar boolean not null default true;

alter table public.profile_settings
  add column if not exists enter_gate_blur boolean not null default true;

comment on column public.profile_settings.enter_gate_title is 'Gate headline; empty uses display name';
comment on column public.profile_settings.enter_gate_subtitle is 'Optional subtext on the enter gate';
comment on column public.profile_settings.enter_gate_button is 'Enter button label';

notify pgrst, 'reload schema';
