import { EffectsPageShell } from "@/components/dashboard/effects-editor";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { resolveMaxUploadBytes } from "@/lib/uploads/limits";

export default async function ProfilePageEffectsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { profile, settings, entitlements } = await loadProfilePageEditor(pageId);

  if (!profile) return null;

  return (
    <EffectsPageShell
      settings={settings}
      profile={profile}
      pageId={pageId}
      maxUploadBytes={resolveMaxUploadBytes(entitlements)}
    />
  );
}
