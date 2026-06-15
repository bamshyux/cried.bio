import { redirect } from "next/navigation";
import { MusicPageShell } from "@/components/dashboard/music-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileSettingsSchemaValidation } from "@/lib/db/validate-schema";
import { createClient } from "@/lib/supabase/server";

export default async function MusicPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const [settings, schema] = await Promise.all([
    getSettingsByProfileId(data.claims.sub as string),
    getProfileSettingsSchemaValidation(),
  ]);

  const musicTitleSupported = schema.ok || !schema.missing.includes("music_title");

  return (
    <MusicPageShell settings={settings} musicTitleSupported={musicTitleSupported} />
  );
}
