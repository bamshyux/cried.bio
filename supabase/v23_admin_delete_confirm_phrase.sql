-- cried.bio v23: Admin delete confirmation uses "I Confirm" phrase

create or replace function public.admin_delete_account(
  p_user_id uuid,
  p_confirm_phrase text
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

  if trim(p_confirm_phrase) <> 'I Confirm' then
    raise exception 'Type "I Confirm" to confirm deletion';
  end if;

  select username into v_username
  from public.profiles
  where id = p_user_id;

  if v_username is null then
    raise exception 'Account not found';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_account(uuid, text) from public;
grant execute on function public.admin_delete_account(uuid, text) to authenticated;

notify pgrst, 'reload schema';
