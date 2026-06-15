-- BioForge v16: Founder badge — exclusive to the platform founder
-- Safe to re-run

update public.badges
set
  description = 'Creator and owner of BioForge',
  category = 'verification',
  is_assignable = false
where slug = 'founder';

-- Remove founder badge from anyone who is not the founder (default: @bamshy)
delete from public.profile_badges pb
using public.badges b
where pb.badge_id = b.id
  and b.slug = 'founder'
  and pb.profile_id not in (
    select id from public.profiles where username = 'bamshy'
  );

-- Grant founder badge to the founder if missing
insert into public.profile_badges (profile_id, badge_id, award_source)
select p.id, b.id, 'staff'
from public.profiles p
cross join public.badges b
where p.username = 'bamshy'
  and b.slug = 'founder'
on conflict (profile_id, badge_id) do nothing;

notify pgrst, 'reload schema';
