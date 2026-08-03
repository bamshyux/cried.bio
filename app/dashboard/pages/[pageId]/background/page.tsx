import { BackgroundPageShell } from "@/components/dashboard/background-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { resolveMaxUploadBytes } from "@/lib/uploads/limits";

export default async function ContentPageBackgroundPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { settings, entitlements } = await loadProfilePageEditor(pageId);

  return (
    <BackgroundPageShell
      settings={settings}
      pageId={pageId}
      contentPage
      maxUploadBytes={resolveMaxUploadBytes(entitlements)}
    />
  );
}
