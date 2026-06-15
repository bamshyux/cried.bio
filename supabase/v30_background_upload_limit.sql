-- cried.bio v30: Raise backgrounds bucket upload limit to 65 MB

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backgrounds',
  'backgrounds',
  true,
  68157440,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 68157440,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

notify pgrst, 'reload schema';
