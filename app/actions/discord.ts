"use server";

import { createClient } from "@/lib/supabase/server";
import { parseDiscordCardConfig } from "@/lib/discord/card-config";
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
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

function selectDefaultProfileSettings(
  supabase: SupabaseClient,
  userId: string,
  columns = "widgets_discord_user_id, discord_username",
) {
  return supabase.from("profile_settings").select(columns).eq("profile_id", userId).is("page_id", null);
}

function updateDefaultProfileSettings(
  supabase: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>,
) {
  return supabase.from("profile_settings").update(patch).eq("profile_id", userId).is("page_id", null);
}

async function getDiscordLinkState(userId: string) {
  const supabase = await createClient();
  const { data, error } = await selectDefaultProfileSettings(supabase, userId).maybeSingle();

  if (error) {
    return { discordUserId: "", discordUsername: "", linked: false, queryError: formatSchemaError(error.message) };
  }

  const row = data as { widgets_discord_user_id?: string; discord_username?: string } | null;
  const discordUserId = String(row?.widgets_discord_user_id ?? "").trim();
  const discordUsername = String(row?.discord_username ?? "").trim();

  return {
    discordUserId,
    discordUsername,
    linked: isDiscordLinked({ discord_user_id: discordUserId, discord_username: discordUsername }),
  };
}

async function revalidateProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard/widgets");
  revalidatePath("/dashboard", "layout");
  if (profile?.username) revalidatePath(`/${profile.username}`);
}

export async function toggleDiscordStatusAction(show: boolean): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const linkState = await getDiscordLinkState(userId);
  if (linkState.queryError) return { error: linkState.queryError };
  if (!linkState.linked && show) {
    return { error: "Connect your Discord account before enabling status on your profile." };
  }

  const widgetResult = await setDiscordStatusWidgetEnabled(userId, show && linkState.linked);
  if (widgetResult.error) return { error: widgetResult.error };

  const patch = await omitUnsupportedSettingsColumns({
    show_discord_status: show && linkState.linked,
  });
  const supabase = await createClient();
  const { error } = await updateDefaultProfileSettings(supabase, userId, patch);

  if (error && !/does not exist/i.test(error.message)) {
    return { error: formatSchemaError(error.message) };
  }

  await revalidateProfile(userId);
  return {};
}

export async function disconnectDiscordAction(): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const widgetResult = await removeDiscordStatusWidget(userId);
  if (widgetResult.error) return { error: widgetResult.error };

  const patch = await omitUnsupportedSettingsColumns({
    widgets_discord_user_id: "",
    discord_username: "",
    discord_avatar: "",
    discord_banner: "",
    discord_premium_type: 0,
    show_discord_status: false,
  });
  const supabase = await createClient();
  const { error } = await updateDefaultProfileSettings(supabase, userId, patch);

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
  const { error } = await updateDefaultProfileSettings(supabase, userId, patch);

  if (error) return { error: formatSchemaError(error.message) };
  const widgetResult = await setDiscordStatusWidgetEnabled(userId, false);
  if (widgetResult.error) return { error: widgetResult.error };
  await revalidateProfile(userId);
  return {};
}

export async function updateDiscordCardConfigAction(
  config: DiscordCardConfig,
): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const linkState = await getDiscordLinkState(userId);
  if (linkState.queryError) return { error: linkState.queryError };
  if (!linkState.linked) {
    return { error: "Connect Discord before customizing the card." };
  }

  const parsed = parseDiscordCardConfig(config);
  const widgetResult = await updateDiscordStatusWidgetConfig(userId, parsed);
  if (widgetResult.error) return { error: widgetResult.error };

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
  await updateDefaultProfileSettings(supabase, userId, patch);
}

export async function refreshDiscordProfileAction(): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not signed in." };

  const supabase = await createClient();
  const { data } = await selectDefaultProfileSettings(supabase, userId).maybeSingle();

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

  await updateDefaultProfileSettings(supabase, userId, patch);
  return {};
}
