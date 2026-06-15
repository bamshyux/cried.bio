import { createClient } from "@/lib/supabase/server";
import { getDiscordStatusWidgetEnabled } from "@/lib/data/discord-widget";
import { mergeSettings } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

export async function getSettingsByProfileId(
  profileId: string,
): Promise<ProfileSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  const row = data as Partial<ProfileSettings> & { widgets_discord_user_id?: string } | null;
  if (row?.gradient_colors && typeof row.gradient_colors === "string") {
    try {
      row.gradient_colors = JSON.parse(row.gradient_colors as unknown as string);
    } catch {
      row.gradient_colors = undefined;
    }
  }

  const settings = mergeSettings(row, profileId);

  const widgetEnabled = await getDiscordStatusWidgetEnabled(profileId);
  if (widgetEnabled != null) {
    settings.show_discord_status = widgetEnabled;
  } else if (settings.discord_user_id.trim()) {
    settings.show_discord_status = true;
  }

  return settings;
}
