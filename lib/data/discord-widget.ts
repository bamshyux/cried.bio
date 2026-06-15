import { createClient } from "@/lib/supabase/server";
import { parseDiscordCardConfig } from "@/lib/discord/card-config";
import type { DiscordCardConfig } from "@/lib/types/discord-widget";

export const DISCORD_STATUS_WIDGET = "discord_status";

export type DiscordStatusWidgetRow = {
  is_enabled: boolean;
  config: DiscordCardConfig;
};

export async function getDiscordStatusWidget(
  profileId: string,
): Promise<DiscordStatusWidgetRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_widgets")
    .select("is_enabled, config")
    .eq("profile_id", profileId)
    .eq("widget_type", DISCORD_STATUS_WIDGET)
    .maybeSingle();

  if (error || !data) return null;
  return {
    is_enabled: data.is_enabled === true,
    config: parseDiscordCardConfig(data.config),
  };
}

export async function setDiscordStatusWidgetEnabled(
  profileId: string,
  enabled: boolean,
  config?: DiscordCardConfig,
) {
  const supabase = await createClient();
  const existing = await getDiscordStatusWidget(profileId);
  await supabase.from("profile_widgets").upsert(
    {
      profile_id: profileId,
      widget_type: DISCORD_STATUS_WIDGET,
      is_enabled: enabled,
      config: config ?? existing?.config ?? {},
    },
    { onConflict: "profile_id,widget_type" },
  );
}

export async function updateDiscordStatusWidgetConfig(
  profileId: string,
  config: DiscordCardConfig,
) {
  const supabase = await createClient();
  const existing = await getDiscordStatusWidget(profileId);
  await supabase.from("profile_widgets").upsert(
    {
      profile_id: profileId,
      widget_type: DISCORD_STATUS_WIDGET,
      is_enabled: existing?.is_enabled ?? false,
      config,
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
