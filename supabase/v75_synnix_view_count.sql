-- cried.bio v75: Seed @synnix with 6000 views (live counter, not frozen)

update public.profiles
set
  view_count = greatest(coalesce(view_count, 0), 6000),
  view_count_frozen = false
where lower(username) = 'synnix';

notify pgrst, 'reload schema';
