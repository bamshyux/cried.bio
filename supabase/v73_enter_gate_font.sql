-- Enter gate font (empty = use profile font)
alter table public.profile_settings
  add column if not exists enter_gate_font_family text not null default '';

comment on column public.profile_settings.enter_gate_font_family is 'Font key for enter gate text; empty uses profile font_family';

notify pgrst, 'reload schema';
