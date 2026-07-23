import { ContentPageTextEditor } from "@/components/dashboard/content-page-editor/text-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ContentPageTextPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { page, settings } = await loadProfilePageEditor(pageId);

  return <ContentPageTextEditor page={page} settings={settings} pageId={pageId} />;
}
