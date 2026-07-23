import { MusicPageShell } from "@/components/dashboard/music-editor";
import { getMusicTracks } from "@/lib/data/music-tracks";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { getProfileSettingsSchemaValidation } from "@/lib/db/validate-schema";
import { getUserEntitlements } from "@/lib/premium/entitlements";

export default async function ContentPageMusicPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, settings } = await loadProfilePageEditor(pageId);
  const [tracks, schema, entitlements] = await Promise.all([
    getMusicTracks(userId, pageId),
    getProfileSettingsSchemaValidation(),
    getUserEntitlements(userId),
  ]);

  const musicTitleSupported = schema.ok || !schema.missing.includes("music_title");

  return (
    <MusicPageShell
      settings={settings}
      tracks={tracks}
      entitlements={entitlements}
      musicTitleSupported={musicTitleSupported}
      pageId={pageId}
    />
  );
}
