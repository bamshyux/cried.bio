import { createHash } from "crypto";
import { headers } from "next/headers";
import { getUsernameChangeCooldown } from "@/lib/username-cooldown";
import { mergeSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountPreferences,
  AccountSettingsData,
  LoginHistoryEntry,
  MfaRecoveryCodeSummary,
  UserSession,
} from "@/lib/types/account-settings";

export const DEFAULT_ACCOUNT_PREFERENCES: Omit<
  AccountPreferences,
  "profile_id" | "created_at" | "updated_at"
> = {
  phone_number: "",
  email_notifications: true,
  marketing_emails: false,
  profile_visibility: "public",
  show_in_search: true,
  hide_view_counts: false,
  allow_direct_contact: true,
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code.replace(/-/g, "").toLowerCase()).digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
  }
  return codes;
}

export function parseDeviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("mac os")) return "Mac";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  if (ua.includes("curl")) return "API client";
  return "Web browser";
}

export async function getRequestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent");
  return {
    ip_address: ip,
    user_agent: userAgent,
    device_label: parseDeviceLabel(userAgent),
  };
}

function mergeAccountPreferences(
  row: Partial<AccountPreferences> | null,
  profileId: string,
): AccountPreferences {
  const now = new Date().toISOString();
  return {
    profile_id: profileId,
    phone_number: row?.phone_number ?? DEFAULT_ACCOUNT_PREFERENCES.phone_number,
    email_notifications: row?.email_notifications ?? DEFAULT_ACCOUNT_PREFERENCES.email_notifications,
    marketing_emails: row?.marketing_emails ?? DEFAULT_ACCOUNT_PREFERENCES.marketing_emails,
    profile_visibility: (row?.profile_visibility ?? DEFAULT_ACCOUNT_PREFERENCES.profile_visibility) as AccountPreferences["profile_visibility"],
    show_in_search: row?.show_in_search ?? DEFAULT_ACCOUNT_PREFERENCES.show_in_search,
    hide_view_counts: row?.hide_view_counts ?? DEFAULT_ACCOUNT_PREFERENCES.hide_view_counts,
    allow_direct_contact: row?.allow_direct_contact ?? DEFAULT_ACCOUNT_PREFERENCES.allow_direct_contact,
    created_at: row?.created_at ?? now,
    updated_at: row?.updated_at ?? now,
  };
}

export async function ensureAccountPreferences(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_preferences")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("account_preferences").insert({ profile_id: userId });
  }
}

export async function getAccountPreferences(userId: string): Promise<AccountPreferences> {
  await ensureAccountPreferences(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_preferences")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  return mergeAccountPreferences(data as Partial<AccountPreferences> | null, userId);
}

export async function getRecoveryCodeSummary(userId: string): Promise<MfaRecoveryCodeSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mfa_recovery_codes")
    .select("id, used_at")
    .eq("user_id", userId);

  const rows = data ?? [];
  const remaining = rows.filter((r) => !r.used_at).length;
  return { total: rows.length, remaining };
}

export async function getLoginHistory(userId: string, limit = 15): Promise<LoginHistoryEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("login_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as LoginHistoryEntry[];
}

export async function getActiveSessions(userId: string): Promise<UserSession[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });

  return (data ?? []) as UserSession[];
}

export async function getAccountSettingsData(userId: string, email: string): Promise<AccountSettingsData> {
  const supabase = await createClient();

  const [preferences, profile, settingsRow, recoveryCodes, loginHistory, sessions, mfaFactors] =
    await Promise.all([
      getAccountPreferences(userId),
      supabase.from("profiles").select("username, username_changed_at").eq("id", userId).maybeSingle(),
      supabase.from("profile_settings").select("*").eq("profile_id", userId).maybeSingle(),
      getRecoveryCodeSummary(userId),
      getLoginHistory(userId),
      getActiveSessions(userId),
      supabase.auth.mfa.listFactors(),
    ]);

  const settings = mergeSettings(settingsRow.data as Parameters<typeof mergeSettings>[0], userId);
  const verifiedFactor = mfaFactors.data?.totp?.find((f) => f.status === "verified") ?? null;

  return {
    email,
    username: profile.data?.username ?? null,
    usernameChangeCooldown: getUsernameChangeCooldown(profile.data?.username_changed_at),
    preferences,
    mfaEnabled: !!verifiedFactor,
    mfaFactorId: verifiedFactor?.id ?? null,
    recoveryCodes,
    loginHistory,
    sessions,
    guestbookEnabled: settings.guestbook_enabled,
    showViewCount: settings.show_view_count,
  };
}

export async function getProfileVisibility(profileId: string): Promise<AccountPreferences["profile_visibility"]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_preferences")
    .select("profile_visibility")
    .eq("profile_id", profileId)
    .maybeSingle();

  return (data?.profile_visibility as AccountPreferences["profile_visibility"]) ?? "public";
}

export async function shouldHideViewCounts(profileId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_preferences")
    .select("hide_view_counts")
    .eq("profile_id", profileId)
    .maybeSingle();

  return data?.hide_view_counts ?? false;
}

export async function recordLoginEvent(userId: string, success: boolean) {
  const supabase = await createClient();
  const meta = await getRequestMeta();

  await supabase.from("login_history").insert({
    user_id: userId,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    device_label: meta.device_label,
    success,
  });
}

export async function touchUserSession(userId: string, sessionId: string | undefined) {
  if (!sessionId) return;

  const supabase = await createClient();
  const meta = await getRequestMeta();
  const sessionHash = hashSessionToken(sessionId);

  await supabase.from("user_sessions").upsert(
    {
      user_id: userId,
      session_token_hash: sessionHash,
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      device_label: meta.device_label,
      last_active_at: new Date().toISOString(),
      revoked_at: null,
    },
    { onConflict: "user_id,session_token_hash" },
  );

  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  if (admin) {
    await admin.from("security_events").insert({
      user_id: userId,
      event_type: "login_success",
      ip_hash: (meta.ip_address ?? "").slice(0, 64),
      user_agent: (meta.user_agent ?? "").slice(0, 512),
    });
  }
}

export async function syncPrivacyToProfileSettings(userId: string, prefs: Partial<AccountPreferences>) {
  const supabase = await createClient();
  const patch: Record<string, boolean> = {};

  if (typeof prefs.hide_view_counts === "boolean") {
    patch.show_view_count = !prefs.hide_view_counts;
  }

  if (Object.keys(patch).length === 0) return;

  await supabase.from("profile_settings").update(patch).eq("profile_id", userId);
}
