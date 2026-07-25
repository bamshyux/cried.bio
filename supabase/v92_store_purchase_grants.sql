-- cried.bio v92: Ensure authenticated users can read purchase history tables
-- Run after v90_store_checkout.sql

grant select on public.purchases to authenticated;
grant select on public.store_purchases to authenticated;

notify pgrst, 'reload schema';
