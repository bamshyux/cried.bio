import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { getSupportConversationById } from "@/lib/data/support";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }

  const viewerId = authData.claims.sub as string;
  const adminAccess = await getAdminAccess();
  const isStaff = Boolean(adminAccess);

  const db = createAdminClient() ?? supabase;
  const { data: attachment, error: attachmentError } = await db
    .from("support_attachments")
    .select("id, storage_path, file_name, mime_type, message_id")
    .eq("id", attachmentId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return new Response("Not found", { status: 404 });
  }

  const { data: message, error: messageError } = await db
    .from("support_messages")
    .select("conversation_id")
    .eq("id", attachment.message_id)
    .maybeSingle();

  if (messageError || !message) {
    return new Response("Not found", { status: 404 });
  }

  const conversation = await getSupportConversationById(
    message.conversation_id,
    viewerId,
    isStaff,
  );
  if (!conversation) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: file, error: downloadError } = await db.storage
    .from("support-attachments")
    .download(attachment.storage_path);

  if (downloadError || !file) {
    return new Response("File unavailable", { status: 404 });
  }

  return new Response(file, {
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `inline; filename="${attachment.file_name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
