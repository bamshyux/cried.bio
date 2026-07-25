import { AdminSupportArchivesClient } from "@/components/admin/admin-support-archives";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { listArchivedTranscripts } from "@/lib/data/support";
import { redirect } from "next/navigation";

export default async function AdminSupportArchivesPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/dashboard");

  const transcripts = await listArchivedTranscripts();

  return <AdminSupportArchivesClient initialTranscripts={transcripts} />;
}
