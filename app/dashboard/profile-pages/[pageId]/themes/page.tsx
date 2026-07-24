import { ThemesPageShell } from "@/components/dashboard/themes-editor";
import { getCustomThemesByProfileId } from "@/lib/data/custom-themes";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { getUserEntitlements } from "@/lib/premium/entitlements";

export default async function ProfilePageThemesPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, settings } = await loadProfilePageEditor(pageId);
  const [themes, entitlements] = await Promise.all([
    getCustomThemesByProfileId(userId),
    getUserEntitlements(userId),
  ]);

  return (
    <ThemesPageShell
      settings={settings}
      themes={themes}
      entitlements={entitlements}
      pageId={pageId}
    />
  );
}
