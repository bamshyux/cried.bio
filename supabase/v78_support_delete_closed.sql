-- cried.bio v78: allow users to delete their own closed support tickets

drop policy if exists "Users delete own closed support conversations" on public.support_conversations;
create policy "Users delete own closed support conversations"
  on public.support_conversations for delete
  using (
    auth.uid() = user_id
    and status = 'closed'
  );

notify pgrst, 'reload schema';
