-- cried.bio v89: AI support assistant, extended statuses, archived transcripts

-- ─── Extended conversation columns ───

alter table public.support_conversations
  add column if not exists category text,
  add column if not exists ai_escalated boolean not null default false,
  add column if not exists ai_session_id uuid,
  add column if not exists closed_at timestamptz,
  add column if not exists first_staff_response_at timestamptz,
  add column if not exists status_history jsonb not null default '[]'::jsonb;

alter table public.support_conversations
  drop constraint if exists support_conversations_status_check;

alter table public.support_conversations
  add constraint support_conversations_status_check
  check (status in (
    'open',
    'waiting_on_staff',
    'waiting_on_user',
    'in_progress',
    'ai_assisting',
    'closed',
    'archived'
  ));

-- ─── AI chat sessions (pre-ticket or linked) ───

create table if not exists public.support_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'resolved', 'escalated')),
  category text,
  conversation_id uuid references public.support_conversations (id) on delete set null,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_ai_sessions_user_idx
  on public.support_ai_sessions (user_id, updated_at desc);

create table if not exists public.support_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.support_ai_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_ai_messages_session_idx
  on public.support_ai_messages (session_id, created_at asc);

alter table public.support_conversations
  drop constraint if exists support_conversations_ai_session_id_fkey;

alter table public.support_conversations
  add constraint support_conversations_ai_session_id_fkey
  foreign key (ai_session_id) references public.support_ai_sessions (id) on delete set null;

-- ─── Archived transcripts (72h retention) ───

create table if not exists public.support_archived_transcripts (
  id uuid primary key default gen_random_uuid(),
  original_conversation_id uuid,
  user_id uuid references public.profiles (id) on delete set null,
  subject text not null,
  category text,
  ai_escalated boolean not null default false,
  assigned_staff_id uuid references public.profiles (id) on delete set null,
  customer_snapshot jsonb not null default '{}'::jsonb,
  staff_snapshot jsonb,
  transcript jsonb not null default '{}'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  opened_at timestamptz not null,
  closed_at timestamptz,
  archived_at timestamptz not null default now(),
  purge_at timestamptz not null,
  restored_conversation_id uuid references public.support_conversations (id) on delete set null
);

create index if not exists support_archived_transcripts_purge_idx
  on public.support_archived_transcripts (purge_at asc);

create index if not exists support_archived_transcripts_archived_idx
  on public.support_archived_transcripts (archived_at desc);

create index if not exists support_archived_transcripts_search_idx
  on public.support_archived_transcripts using gin (transcript jsonb_path_ops);

-- ─── Row Level Security ───

alter table public.support_ai_sessions enable row level security;
alter table public.support_ai_messages enable row level security;
alter table public.support_archived_transcripts enable row level security;

drop policy if exists "Users manage own AI sessions" on public.support_ai_sessions;
create policy "Users manage own AI sessions"
  on public.support_ai_sessions for all
  using (auth.uid() = user_id or public.is_platform_admin())
  with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists "Users read AI messages in own sessions" on public.support_ai_messages;
create policy "Users read AI messages in own sessions"
  on public.support_ai_messages for select
  using (
    exists (
      select 1 from public.support_ai_sessions s
      where s.id = session_id
        and (s.user_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Users send AI messages in own sessions" on public.support_ai_messages;
create policy "Users send AI messages in own sessions"
  on public.support_ai_messages for insert
  with check (
    exists (
      select 1 from public.support_ai_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
        and s.status = 'active'
    )
  );

drop policy if exists "Staff insert AI assistant messages" on public.support_ai_messages;
create policy "Staff insert AI assistant messages"
  on public.support_ai_messages for insert
  with check (public.is_platform_admin());

drop policy if exists "Staff manage archived transcripts" on public.support_archived_transcripts;
create policy "Staff manage archived transcripts"
  on public.support_archived_transcripts for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
