import { redirect } from "next/navigation";
import { MusicPageShell } from "@/components/dashboard/music-editor";
import { getMusicTracks } from "@/lib/data/music-tracks";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileSettingsSchemaValidation } from "@/lib/db/validate-schema";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function MusicPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, schema, tracks, entitlements] = await Promise.all([
    getSettingsByProfileId(userId),
    getProfileSettingsSchemaValidation(),
    getMusicTracks(userId),
    getUserEntitlements(userId),
  ]);

  const musicTitleSupported = schema.ok || !schema.missing.includes("music_title");

  return (
    <MusicPageShell
      settings={settings}
      tracks={tracks}
      entitlements={entitlements}
      musicTitleSupported={musicTitleSupported}
    />
  );
}
