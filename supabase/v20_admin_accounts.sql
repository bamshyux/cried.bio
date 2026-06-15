-- cried.bio v20: Super-admin account management RPCs
-- Works with the logged-in super-admin session (no service role key required).
-- Run in Supabase Dashboard → SQL Editor

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt()->>'email', '')) = 'jjbamshy1@gmail.com';
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.admin_list_accounts()
returns table (
  id uuid,
  email text,
  uid bigint,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  is_admin boolean,
  premium_tier text,
  premium_expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.uid,
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.banner_url,
    coalesce(p.is_admin, false),
    coalesce(p.premium_tier, 'free'),
    p.premium_expires_at,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.uid asc nulls last, p.created_at asc;
end;
$$;

revoke all on function public.admin_list_accounts() from public;
grant execute on function public.admin_list_accounts() to authenticated;

create or replace function public.admin_update_account(
  p_user_id uuid,
  p_username text,
  p_display_name text,
  p_bio text,
  p_is_admin boolean,
  p_premium_tier text,
  p_premium_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id is null then
    raise exception 'Missing account id';
  end if;

  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'Username is required';
  end if;

  p_username := lower(trim(p_username));

  if p_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'Invalid username format';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Account not found';
  end if;

  if exists (
    select 1 from public.profiles
    where username = p_username and id <> p_user_id
  ) then
    raise exception 'That username is already taken';
  end if;

  update public.profiles
  set
    username = p_username,
    display_name = coalesce(nullif(trim(p_display_name), ''), ''),
    bio = coalesce(p_bio, ''),
    is_admin = coalesce(p_is_admin, false),
    premium_tier = case when p_premium_tier = 'premium' then 'premium' else 'free' end,
    premium_expires_at = p_premium_expires_at,
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_update_account(uuid, text, text, text, boolean, text, timestamptz) from public;
grant execute on function public.admin_update_account(uuid, text, text, text, boolean, text, timestamptz) to authenticated;

create or replace function public.admin_delete_account(
  p_user_id uuid,
  p_confirm_username text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_username text;
begin
  if not public.is_super_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id is null then
    raise exception 'Missing account id';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account from here';
  end if;

  select username into v_username
  from public.profiles
  where id = p_user_id;

  if v_username is null then
    raise exception 'Account not found';
  end if;

  if lower(trim(p_confirm_username)) <> v_username then
    raise exception 'Confirmation username does not match';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_account(uuid, text) from public;
grant execute on function public.admin_delete_account(uuid, text) to authenticated;

notify pgrst, 'reload schema';
