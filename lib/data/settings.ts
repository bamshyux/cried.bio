import { createClient } from "@/lib/supabase/server";
import { applyDiscordCardConfig } from "@/lib/discord/card-config";
import { isValidDiscordUserId } from "@/lib/discord/connection";
import { getDiscordStatusWidget } from "@/lib/data/discord-widget";
import { mergeSettings } from "@/lib/settings";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { enforceCardBorderEffectEntitlement } from "@/lib/card-border-effects/premium";
import { enforceProfileLayoutEntitlement } from "@/lib/premium/layout-settings";
import { enforceMusicPlayerVisibility } from "@/lib/premium/music-settings";
import type { ProfileSettings } from "@/lib/types/settings";

export async function getSettingsByProfileId(
  profileId: string,
): Promise<ProfileSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", profileId)
    .is("page_id", null)
    .maybeSingle();

  // Fallback: if no primary row exists yet, use the oldest settings row for this profile.
  let row = data as Partial<ProfileSettings> & { widgets_discord_user_id?: string } | null;
  if (!row) {
    const { data: fallback } = await supabase
      .from("profile_settings")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    row = fallback as typeof row;
  }
  if (row?.gradient_colors && typeof row.gradient_colors === "string") {
    try {
      row.gradient_colors = JSON.parse(row.gradient_colors as unknown as string);
    } catch {
      row.gradient_colors = undefined;
    }
  }
  if (row?.enter_gate_gradient_colors && typeof row.enter_gate_gradient_colors === "string") {
    try {
      row.enter_gate_gradient_colors = JSON.parse(row.enter_gate_gradient_colors as unknown as string);
    } catch {
      row.enter_gate_gradient_colors = undefined;
    }
  }

  let settings = mergeSettings(row, profileId);
  const widget = await getDiscordStatusWidget(profileId);
  const hasDiscordId = isValidDiscordUserId(settings.discord_user_id);

  if (!hasDiscordId) {
    settings.discord_user_id = "";
    settings.discord_username = "";
    settings.discord_avatar = "";
    settings.discord_banner = "";
    settings.discord_premium_type = 0;
    settings.show_discord_status = false;
  } else {
    settings.show_discord_status = row?.show_discord_status === true;
    if (widget) {
      settings = applyDiscordCardConfig(settings, widget.config);
    }
  }

  const entitlements = await getUserEntitlements(profileId);
  settings = enforceMusicPlayerVisibility(settings, entitlements.can_use_playlist);
  settings = enforceCardBorderEffectEntitlement(settings, entitlements.animated_effects);
  settings = {
    ...settings,
    layout: enforceProfileLayoutEntitlement(settings.layout, entitlements.animated_effects),
  };

  return settings;
}
