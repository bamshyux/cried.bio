import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupportAiMessages,
  getSupportInternalNotes,
  getSupportMessages,
} from "@/lib/data/support";
import { formatSupportReferenceId } from "@/lib/support/reference-id";
import { buildSupportTranscriptPayload, transcriptToMarkdown } from "@/lib/support/transcript";
import { normalizeSupportStatus } from "@/lib/types/support";

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const access = await getAdminAccess();
  if (!access) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { conversationId } = await context.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const { data: row, error } = await admin
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const profileIds = [row.user_id, row.assigned_to].filter(Boolean) as string[];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const customer = profileMap.get(row.user_id) ?? null;
  const assignee = row.assigned_to ? profileMap.get(row.assigned_to) ?? null : null;

  const conversation = {
    ...row,
    status: normalizeSupportStatus(row.status),
    customer: customer
      ? {
          id: customer.id,
          username: customer.username,
          display_name: customer.display_name ?? customer.username ?? "User",
          avatar_url: customer.avatar_url,
        }
      : null,
    assignee: assignee
      ? {
          id: assignee.id,
          username: assignee.username,
          display_name: assignee.display_name ?? assignee.username ?? "Staff",
          avatar_url: assignee.avatar_url,
        }
      : null,
  };

  const [messages, notes, aiMessages] = await Promise.all([
    getSupportMessages(conversationId),
    getSupportInternalNotes(conversationId),
    row.ai_session_id ? getSupportAiMessages(row.ai_session_id) : Promise.resolve([]),
  ]);

  const transcript = buildSupportTranscriptPayload({
    conversation,
    messages,
    notes,
    aiMessages,
  });

  const referenceId = formatSupportReferenceId(conversationId);
  const format = new URL(request.url).searchParams.get("format");

  if (format === "md" || format === "markdown") {
    const markdown = transcriptToMarkdown(transcript);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${referenceId}.md"`,
      },
    });
  }

  return NextResponse.json(
    {
      referenceId,
      conversationId,
      transcript,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${referenceId}.json"`,
      },
    },
  );
}
