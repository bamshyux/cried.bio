-- Store Discord webhook message ID for support ticket embed updates
alter table public.support_conversations
  add column if not exists discord_webhook_message_id text;

create index if not exists support_conversations_discord_msg_idx
  on public.support_conversations (discord_webhook_message_id)
  where discord_webhook_message_id is not null;
