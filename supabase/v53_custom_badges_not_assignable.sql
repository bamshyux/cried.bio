-- cried.bio v53: Custom badges are direct-assign only (not in admin assign dropdown)
-- Run in Supabase Dashboard → SQL Editor (after v5_badges.sql)

update public.badges
set is_assignable = false
where category = 'custom';
