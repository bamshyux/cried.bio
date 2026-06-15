import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import { setDiscordStatusWidgetEnabled } from "@/lib/data/discord-widget";
import {
  getDiscordClientId,
  getDiscordClientSecret,
  getDiscordRedirectUri,
} from "@/lib/discord/config";
import type { DiscordOAuthUser } from "@/lib/discord/types";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "discord_oauth_state";
const USER_COOKIE = "discord_oauth_uid";

function redirectWithMessage(code: string) {
  return NextResponse.redirect(`${getSiteUrl()}/dashboard/widgets?discord=${code}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectWithMessage("denied");
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  const userId = cookieStore.get(USER_COOKIE)?.value;

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(USER_COOKIE);

  if (!code || !state || !savedState || state !== savedState || !userId) {
    return redirectWithMessage("invalid");
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims?.sub || authData.claims.sub !== userId) {
    return redirectWithMessage("unauthorized");
  }

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getDiscordClientId(),
      client_secret: getDiscordClientSecret(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getDiscordRedirectUri(),
    }),
  });

  if (!tokenRes.ok) {
    return redirectWithMessage("token_failed");
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return redirectWithMessage("token_failed");
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!userRes.ok) {
    return redirectWithMessage("user_failed");
  }

  const discordUser = (await userRes.json()) as DiscordOAuthUser;
  const patch = await omitUnsupportedSettingsColumns({
    widgets_discord_user_id: discordUser.id,
    discord_username: discordUser.global_name || discordUser.username,
    discord_avatar: discordUser.avatar ?? "",
    show_discord_status: true,
  });

  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) {
    return redirectWithMessage("save_failed");
  }

  await setDiscordStatusWidgetEnabled(userId, true);

  return redirectWithMessage("connected");
}
