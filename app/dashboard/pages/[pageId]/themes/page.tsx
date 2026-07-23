import { ThemesPageShell } from "@/components/dashboard/themes-editor";
import { getCustomThemesByProfileId } from "@/lib/data/custom-themes";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ContentPageThemesPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, settings } = await loadProfilePageEditor(pageId);
  const themes = await getCustomThemesByProfileId(userId);

  return <ThemesPageShell settings={settings} themes={themes} pageId={pageId} />;
}
