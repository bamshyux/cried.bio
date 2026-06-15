import { createClient } from "@/lib/supabase/server";

export const DISCORD_STATUS_WIDGET = "discord_status";

export async function getDiscordStatusWidgetEnabled(profileId: string): Promise<boolean | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_widgets")
    .select("is_enabled")
    .eq("profile_id", profileId)
    .eq("widget_type", DISCORD_STATUS_WIDGET)
    .maybeSingle();

  if (error || !data) return null;
  return data.is_enabled;
}

export async function setDiscordStatusWidgetEnabled(profileId: string, enabled: boolean) {
  const supabase = await createClient();
  await supabase.from("profile_widgets").upsert(
    {
      profile_id: profileId,
      widget_type: DISCORD_STATUS_WIDGET,
      is_enabled: enabled,
      config: {},
    },
    { onConflict: "profile_id,widget_type" },
  );
}

export async function removeDiscordStatusWidget(profileId: string) {
  const supabase = await createClient();
  await supabase
    .from("profile_widgets")
    .delete()
    .eq("profile_id", profileId)
    .eq("widget_type", DISCORD_STATUS_WIDGET);
}
