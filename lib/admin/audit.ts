import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { adminAuditToDiscordInput, queueAuditLog } from "@/lib/discord/audit-webhook";

export async function logAdminAudit(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetUserId?: string | null;
  details?: Record<string, unknown>;
}) {
  const row = {
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    details: input.details ?? {},
  };

  const admin = createAdminClient();
  if (admin) {
    await admin.from("admin_audit_logs").insert(row);
  } else {
    const supabase = await createClient();
    await supabase.from("admin_audit_logs").insert(row);
  }

  queueAuditLog(adminAuditToDiscordInput(input));
}

export async function logUserTimelineEvent(input: {
  userId: string;
  eventType: string;
  title: string;
  metadata?: Record<string, unknown>;
}) {
  const row = {
    user_id: input.userId,
    event_type: input.eventType,
    title: input.title,
    metadata: input.metadata ?? {},
  };

  const admin = createAdminClient();
  if (admin) {
    await admin.from("user_timeline_events").insert(row);
    return;
  }

  const supabase = await createClient();
  await supabase.from("user_timeline_events").insert(row);
}
