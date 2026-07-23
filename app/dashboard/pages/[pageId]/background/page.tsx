import { BackgroundPageShell } from "@/components/dashboard/background-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ContentPageBackgroundPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { settings } = await loadProfilePageEditor(pageId);

  return <BackgroundPageShell settings={settings} pageId={pageId} />;
}
