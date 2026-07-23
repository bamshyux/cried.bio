import { ContentPageEffectsEditor } from "@/components/dashboard/content-page-editor/effects-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ContentPageEffectsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { page, settings } = await loadProfilePageEditor(pageId);

  return <ContentPageEffectsEditor page={page} settings={settings} pageId={pageId} />;
}
