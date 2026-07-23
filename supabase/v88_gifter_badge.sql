-- cried.bio v88: Gifter badge (catalog entry only)
-- Safe to re-run

insert into public.badges (slug, name, icon, color, description, category, rarity, sort_order, is_assignable)
values (
  'gifter',
  'Gifter',
  'gifter',
  '#f472b6',
  'Gifted Premium or Store items to another creator.',
  'supporter',
  'legendary',
  5,
  false
)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  description = excluded.description,
  category = excluded.category,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order,
  is_assignable = excluded.is_assignable;

notify pgrst, 'reload schema';
