-- cried.bio v105: One Year account-age badge — ensure catalog row + backfill eligible users
-- Awards account-1yr when profiles.created_at is at least 1 year ago (synced on dashboard login).

insert into public.badges (slug, name, description, icon, color, category, rarity, award_rule, is_assignable, is_system, sort_order)
values (
  'account-1yr',
  'One Year',
  'cried.bio member for 1 year',
  'account-1yr',
  '#f59e0b',
  'milestone',
  'rare',
  'account_1yr',
  false,
  true,
  165
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  category = excluded.category,
  rarity = excluded.rarity,
  award_rule = excluded.award_rule,
  is_assignable = false,
  is_system = true,
  sort_order = excluded.sort_order;

-- Backfill anyone who already passed their one-year mark
insert into public.profile_badges (profile_id, badge_id, award_source)
select p.id, b.id, 'analytics'
from public.profiles p
cross join public.badges b
where b.slug = 'account-1yr'
  and p.created_at <= now() - interval '1 year'
on conflict (profile_id, badge_id) do nothing;

notify pgrst, 'reload schema';
