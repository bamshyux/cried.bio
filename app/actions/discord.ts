"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchLanyardDiscordUser } from "@/lib/discord/lanyard";
import { DISCORD_LANYARD_SAVE_ERROR } from "@/lib/discord/messages";
import {
  collectNitroSignalsFromUser,
  inferPremiumTypeFromProfileSignals,
} from "@/lib/discord/profile-badges";
import { isDiscordLinked, needsDiscordProfileRefresh } from "@/lib/discord/connection";
import {
  removeDiscordStatusWidget,
  setDiscordStatusWidgetEnabled,
  updateDiscordStatusWidgetConfig,
} from "@/lib/data/discord-widget";
import type { DiscordCardConfig } from "@/lib/types/discord-widget";
import { formatSchemaError } from "@/lib/db/schema";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import { revalidateAfterProfileAppearanceChange } from "@/lib/profile-presets/revalidate";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function getDiscordLinkState(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("widgets_discord_user_id, discord_username")
    .eq("profile_id", userId)
    .maybeSingle();

  const row = data as { widgets_discord_user_id?: string; discord_username?: string } | null;
  const discordUserId = String(row?.widgets_discord_user_id ?? "").trim();
  const discordUsername = String(row?.discord_username ?? "").trim();

  return { discordUserId, discordUsername, linked: isDiscordLinked({ discord_user_id: discordUserId, discord_username: discordUsername }) };
}

async function revalidateProfile(userId: string) {
  await revalidateAfterProfileAppearanceChange(userId, ["/dashboard/widgets"]);
}

export async function toggleDiscordStatusAction(show: boolean): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const { linked } = await getDiscordLinkState(userId);
  if (!linked && show) {
    return { error: "Connect your Discord account before enabling status on your profile." };
  }

  await setDiscordStatusWidgetEnabled(userId, show && linked);

  const patch = await omitUnsupportedSettingsColumns({
    show_discord_status: show && linked,
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error && !/does not exist/i.test(error.message)) {
    return { error: formatSchemaError(error.message) };
  }

  await revalidateProfile(userId);
  return {};
}

export async function disconnectDiscordAction(): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  await removeDiscordStatusWidget(userId);

  const patch = await omitUnsupportedSettingsColumns({
    widgets_discord_user_id: "",
    discord_username: "",
    discord_avatar: "",
    discord_banner: "",
    discord_premium_type: 0,
    show_discord_status: false,
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };
  await revalidateProfile(userId);
  return {};
}

export async function saveDiscordUserIdAction(discordUserId: string): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const trimmed = discordUserId.trim();
  if (!/^\d{17,20}$/.test(trimmed)) {
    return { error: "Enter a valid Discord user ID (17–20 digits)." };
  }

  const lanyardUser = await fetchLanyardDiscordUser(trimmed);
  if (!lanyardUser?.username) {
    return { error: DISCORD_LANYARD_SAVE_ERROR };
  }

  const premiumType = inferPremiumTypeFromProfileSignals(
    collectNitroSignalsFromUser(lanyardUser.user),
  );

  const patch = await omitUnsupportedSettingsColumns({
    widgets_discord_user_id: trimmed,
    discord_username: lanyardUser.username,
    discord_avatar: lanyardUser.avatar ?? "",
    discord_banner: lanyardUser.banner ?? "",
    discord_premium_type: premiumType,
    show_discord_status: false,
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };
  await setDiscordStatusWidgetEnabled(userId, false);
  await revalidateProfile(userId);
  return {};
}

export async function updateDiscordCardConfigAction(
  config: DiscordCardConfig,
): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const { linked } = await getDiscordLinkState(userId);
  if (!linked) {
    return { error: "Connect Discord before customizing the card." };
  }

  await updateDiscordStatusWidgetConfig(userId, config);
  await revalidateProfile(userId);
  return {};
}

export async function sanitizeDiscordConnectionAction(): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  const { linked, discordUserId, discordUsername } = await getDiscordLinkState(userId);

  if (needsDiscordProfileRefresh({ discord_user_id: discordUserId, discord_username: discordUsername })) {
    await refreshDiscordProfileAction();
    return;
  }

  if (linked || !discordUserId) return;

  await removeDiscordStatusWidget(userId);

  const patch = await omitUnsupportedSettingsColumns({
    widgets_discord_user_id: "",
    discord_username: "",
    discord_avatar: "",
    discord_banner: "",
    discord_premium_type: 0,
    show_discord_status: false,
  });
  const supabase = await createClient();
  await supabase.from("profile_settings").update(patch).eq("profile_id", userId);
}

export async function refreshDiscordProfileAction(): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("widgets_discord_user_id, discord_username")
    .eq("profile_id", userId)
    .maybeSingle();

  const row = data as { widgets_discord_user_id?: string; discord_username?: string } | null;
  const discordUserId = String(row?.widgets_discord_user_id ?? "").trim();
  if (!discordUserId) return {};

  const lanyardUser = await fetchLanyardDiscordUser(discordUserId);
  if (!lanyardUser?.username) {
    return {};
  }

  const premiumType = inferPremiumTypeFromProfileSignals(
    collectNitroSignalsFromUser(lanyardUser.user),
  );

  const patch = await omitUnsupportedSettingsColumns({
    discord_username: lanyardUser.username,
    discord_avatar: lanyardUser.avatar ?? "",
    discord_banner: lanyardUser.banner ?? "",
    discord_premium_type: premiumType,
  });

  await supabase.from("profile_settings").update(patch).eq("profile_id", userId);
  await revalidateProfile(userId);
  return {};
}
