import { EffectsPageShell } from "@/components/dashboard/effects-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ContentPageEffectsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { profile, settings } = await loadProfilePageEditor(pageId);

  if (!profile) return null;

  return (
    <EffectsPageShell
      settings={settings}
      profile={profile}
      pageId={pageId}
      hideEnterGate
    />
  );
}
