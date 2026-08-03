-- Premium: raise per-bucket limits to 100 MB for large media uploads.
-- IMPORTANT: Supabase Free caps ALL uploads at 50 MB globally (Storage → Settings).
-- Files over 50 MB require Supabase Pro AND raising the global file size limit in the dashboard.
-- After upgrading, set SUPABASE_STORAGE_GLOBAL_LIMIT_BYTES=104857600 in your app env.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backgrounds',
  'backgrounds',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music',
  'music',
  true,
  104857600,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

notify pgrst, 'reload schema';
