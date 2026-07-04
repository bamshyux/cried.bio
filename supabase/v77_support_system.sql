-- cried.bio v77: customer support system

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'waiting_on_staff', 'waiting_on_user', 'closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  is_priority boolean not null default false,
  is_pinned boolean not null default false,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_conversations_user_idx
  on public.support_conversations (user_id, updated_at desc);

create index if not exists support_conversations_status_idx
  on public.support_conversations (status, updated_at desc);

create index if not exists support_conversations_assigned_idx
  on public.support_conversations (assigned_to, updated_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  is_staff boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_idx
  on public.support_messages (conversation_id, created_at asc);

create index if not exists support_messages_unread_idx
  on public.support_messages (conversation_id, read_at)
  where read_at is null;

create table if not exists public.support_internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_internal_notes_conversation_idx
  on public.support_internal_notes (conversation_id, created_at desc);

create table if not exists public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_messages (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists support_attachments_message_idx
  on public.support_attachments (message_id);

-- ─── Row Level Security ───

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_internal_notes enable row level security;
alter table public.support_attachments enable row level security;

drop policy if exists "Users read own support conversations" on public.support_conversations;
create policy "Users read own support conversations"
  on public.support_conversations for select
  using (
    auth.uid() = user_id
    or public.is_platform_admin()
  );

drop policy if exists "Users create own support conversations" on public.support_conversations;
create policy "Users create own support conversations"
  on public.support_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own support conversations" on public.support_conversations;
create policy "Users update own support conversations"
  on public.support_conversations for update
  using (
    auth.uid() = user_id
    or public.is_platform_admin()
  )
  with check (
    auth.uid() = user_id
    or public.is_platform_admin()
  );

drop policy if exists "Staff manage support conversations" on public.support_conversations;
create policy "Staff manage support conversations"
  on public.support_conversations for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Users read support messages in own conversations" on public.support_messages;
create policy "Users read support messages in own conversations"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id
        and (c.user_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Users send support messages in own conversations" on public.support_messages;
create policy "Users send support messages in own conversations"
  on public.support_messages for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.support_conversations c
        where c.id = conversation_id
          and c.user_id = auth.uid()
      )
      or public.is_platform_admin()
    )
  );

drop policy if exists "Users update read receipts on own conversation messages" on public.support_messages;
create policy "Users update read receipts on own conversation messages"
  on public.support_messages for update
  using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id
        and (c.user_id = auth.uid() or public.is_platform_admin())
    )
  )
  with check (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id
        and (c.user_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Staff manage support internal notes" on public.support_internal_notes;
create policy "Staff manage support internal notes"
  on public.support_internal_notes for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Users read attachments in own conversations" on public.support_attachments;
create policy "Users read attachments in own conversations"
  on public.support_attachments for select
  using (
    exists (
      select 1
      from public.support_messages m
      join public.support_conversations c on c.id = m.conversation_id
      where m.id = message_id
        and (c.user_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Users upload attachments to own conversations" on public.support_attachments;
create policy "Users upload attachments to own conversations"
  on public.support_attachments for insert
  with check (
    exists (
      select 1
      from public.support_messages m
      join public.support_conversations c on c.id = m.conversation_id
      where m.id = message_id
        and m.author_id = auth.uid()
        and (c.user_id = auth.uid() or public.is_platform_admin())
    )
  );

-- ─── Storage bucket (private attachments) ───

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Support attachment read" on storage.objects;
create policy "Support attachment read"
  on storage.objects for select
  using (
    bucket_id = 'support-attachments'
    and (
      public.is_platform_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Support attachment upload" on storage.objects;
create policy "Support attachment upload"
  on storage.objects for insert
  with check (
    bucket_id = 'support-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Support attachment delete" on storage.objects;
create policy "Support attachment delete"
  on storage.objects for delete
  using (
    bucket_id = 'support-attachments'
    and (
      public.is_platform_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- ─── Realtime ───

do $$
begin
  alter publication supabase_realtime add table public.support_conversations;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.support_messages;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
