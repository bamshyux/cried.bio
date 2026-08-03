import {
  getDiscordBotToken,
  getDiscordGuildId,
  getDiscordPremiumRoleId,
  isDiscordGuildRoleSyncConfigured,
} from "@/lib/discord/config";
import { resolvePremiumActiveState } from "@/lib/premium/subscription-status";
import { createAdminClient } from "@/lib/supabase/admin";

type RoleAction = "add" | "remove";

async function getLinkedDiscordUserId(profileId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("profile_settings")
    .select("widgets_discord_user_id")
    .eq("profile_id", profileId)
    .is("page_id", null)
    .maybeSingle();

  const discordUserId = String(data?.widgets_discord_user_id ?? "").trim();
  return /^\d{17,20}$/.test(discordUserId) ? discordUserId : null;
}

async function userHasActivePremium(profileId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    admin.from("profiles").select("premium_tier, premium_expires_at").eq("id", profileId).maybeSingle(),
    admin
      .from("premium_subscriptions")
      .select("lifetime, status")
      .eq("user_id", profileId)
      .in("status", ["active", "trialing"])
      .order("lifetime", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { active } = resolvePremiumActiveState({
    premium_tier: profile?.premium_tier,
    premium_expires_at: profile?.premium_expires_at,
    lifetime: Boolean(subscription?.lifetime),
  });

  return active;
}

async function modifyGuildMemberRole(
  discordUserId: string,
  action: RoleAction,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isDiscordGuildRoleSyncConfigured()) {
    return { ok: true };
  }

  const token = getDiscordBotToken();
  const guildId = getDiscordGuildId();
  const roleId = getDiscordPremiumRoleId();

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: action === "add" ? "PUT" : "DELETE",
      headers: { Authorization: `Bot ${token}` },
    },
  );

  if (response.status === 204 || response.status === 200) {
    return { ok: true };
  }

  // Member not in the guild — nothing to do until they join.
  if (response.status === 404) {
    return { ok: true };
  }

  let detail = "";
  try {
    const body = (await response.json()) as { message?: string };
    detail = body.message ? `: ${body.message}` : "";
  } catch {
    // ignore parse errors
  }

  return {
    ok: false,
    reason: `Discord role ${action} failed (${response.status})${detail}`,
  };
}

export async function grantPremiumDiscordRole(
  profileId: string,
  discordUserId?: string | null,
): Promise<void> {
  if (!isDiscordGuildRoleSyncConfigured()) return;

  const linkedId = discordUserId?.trim() || (await getLinkedDiscordUserId(profileId));
  if (!linkedId) return;

  const result = await modifyGuildMemberRole(linkedId, "add");
  if (!result.ok) {
    console.error("[discord-premium-role] grant failed", { profileId, discordUserId: linkedId, reason: result.reason });
  }
}

export async function revokePremiumDiscordRole(
  profileId: string,
  discordUserId?: string | null,
): Promise<void> {
  if (!isDiscordGuildRoleSyncConfigured()) return;

  const linkedId = discordUserId?.trim() || (await getLinkedDiscordUserId(profileId));
  if (!linkedId) return;

  const result = await modifyGuildMemberRole(linkedId, "remove");
  if (!result.ok) {
    console.error("[discord-premium-role] revoke failed", { profileId, discordUserId: linkedId, reason: result.reason });
  }
}

/** Grant or revoke based on current cried.bio premium + linked Discord account. */
export async function syncPremiumDiscordRoleForUser(profileId: string): Promise<void> {
  if (!isDiscordGuildRoleSyncConfigured()) return;

  const [active, discordUserId] = await Promise.all([
    userHasActivePremium(profileId),
    getLinkedDiscordUserId(profileId),
  ]);

  if (!discordUserId) return;

  if (active) {
    await grantPremiumDiscordRole(profileId, discordUserId);
  } else {
    await revokePremiumDiscordRole(profileId, discordUserId);
  }
}

export function queuePremiumDiscordRoleSync(
  profileId: string,
  mode: "grant" | "revoke" | "sync",
  discordUserId?: string | null,
) {
  const run =
    mode === "grant"
      ? () => grantPremiumDiscordRole(profileId, discordUserId)
      : mode === "revoke"
        ? () => revokePremiumDiscordRole(profileId, discordUserId)
        : () => syncPremiumDiscordRoleForUser(profileId);

  void run().catch((error) => {
    console.error("[discord-premium-role] sync error", { profileId, mode, error });
  });
}
