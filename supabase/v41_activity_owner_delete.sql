-- cried.bio v41: Allow profile owners to delete their activity feed events

drop policy if exists "activity_owner_delete" on public.activity_events;
create policy "activity_owner_delete" on public.activity_events
  for delete using (auth.uid() = profile_id);

notify pgrst, 'reload schema';
