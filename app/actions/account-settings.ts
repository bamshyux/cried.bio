"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ensureAccountPreferences,
  generateRecoveryCodes,
  getAccountPreferences,
  hashRecoveryCode,
  syncPrivacyToProfileSettings,
} from "@/lib/data/account-settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { deliverEmailChangeConfirmation } from "@/lib/auth/deliver-auth-link-email";
import { buildAuthEmailErrorMessage } from "@/lib/auth/auth-email-shared";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { createClient } from "@/lib/supabase/server";
import type { AccountSettingsFormState, ProfileVisibility } from "@/lib/types/account-settings";

async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    supabase,
    userId: data.claims.sub as string,
    email: (data.claims.email as string | undefined) ?? "",
    sessionId: data.claims.session_id as string | undefined,
  };
}

function parseBool(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

export async function updateUsernameAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  if (!username) return { error: "Username is required." };
  if (!isValidUsername(username)) {
    return { error: "Username must be 3–20 characters: lowercase letters, numbers, underscores." };
  }

  const moderationError = await rejectIfModerated(username, "username", auth.userId);
  if (moderationError) return { error: moderationError };

  const { data: taken } = await auth.supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", auth.userId)
    .maybeSingle();

  if (taken) return { error: "That username is already taken." };

  const { data: existing } = await auth.supabase
    .from("profiles")
    .select("username")
    .eq("id", auth.userId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("profiles")
    .update({ username })
    .eq("id", auth.userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/profile");
  if (existing?.username) revalidatePath(`/${existing.username}`);
  revalidatePath(`/${username}`);

  return { success: "Username updated." };
}

export async function updateEmailAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const { error } = await auth.supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  const delivery = await deliverEmailChangeConfirmation({
    email: auth.email,
    newEmail: email,
  });

  revalidatePath("/dashboard/settings");
  if (!delivery.sent) {
    return {
      error: buildAuthEmailErrorMessage({
        purpose: "email_change",
        resendError: delivery.resendError,
        supabaseError: delivery.supabaseError,
      }),
    };
  }

  return { success: "Confirmation sent to your new email address." };
}

export async function changePasswordAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const password = String(formData.get("password") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");

  if (!password || !repeatPassword) return { error: "Both password fields are required." };
  if (password !== repeatPassword) return { error: "Passwords do not match." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const { error } = await auth.supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: "Password updated." };
}

export async function updateProfileVisibilityAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const visibility = String(formData.get("profile_visibility") ?? "public") as ProfileVisibility;
  if (!["public", "unlisted", "private"].includes(visibility)) {
    return { error: "Invalid visibility option." };
  }

  await ensureAccountPreferences(auth.userId);
  const { error } = await auth.supabase
    .from("account_preferences")
    .update({ profile_visibility: visibility })
    .eq("profile_id", auth.userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  const { data: profile } = await auth.supabase.from("profiles").select("username").eq("id", auth.userId).maybeSingle();
  if (profile?.username) revalidatePath(`/${profile.username}`);

  return { success: "Profile visibility updated." };
}

export async function updateContactPreferencesAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  await ensureAccountPreferences(auth.userId);
  const phone = String(formData.get("phone_number") ?? "").trim().slice(0, 32);

  const { error } = await auth.supabase
    .from("account_preferences")
    .update({
      phone_number: phone,
      email_notifications: parseBool(formData.get("email_notifications")),
      marketing_emails: parseBool(formData.get("marketing_emails")),
    })
    .eq("profile_id", auth.userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Contact preferences saved." };
}

export async function updatePrivacyPreferencesAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  await ensureAccountPreferences(auth.userId);
  const hideViewCounts = parseBool(formData.get("hide_view_counts"));
  const allowGuestbook = parseBool(formData.get("allow_guestbook"));
  const allowDirectContact = parseBool(formData.get("allow_direct_contact"));

  const { error } = await auth.supabase
    .from("account_preferences")
    .update({
      show_in_search: parseBool(formData.get("show_in_search")),
      hide_view_counts: hideViewCounts,
      allow_direct_contact: allowDirectContact,
    })
    .eq("profile_id", auth.userId);

  if (error) return { error: error.message };

  await auth.supabase
    .from("profile_settings")
    .update({ guestbook_enabled: allowGuestbook, show_view_count: !hideViewCounts })
    .eq("profile_id", auth.userId);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/guestbook");
  const { data: profile } = await auth.supabase.from("profiles").select("username").eq("id", auth.userId).maybeSingle();
  if (profile?.username) revalidatePath(`/${profile.username}`);

  return { success: "Privacy settings saved." };
}

export async function storeMfaRecoveryCodesAction(): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const { data: factors } = await auth.supabase.auth.mfa.listFactors();
  const verified = factors?.totp?.find((f) => f.status === "verified");
  if (!verified) return { error: "Enable two-factor authentication first." };

  const codes = generateRecoveryCodes();
  await auth.supabase.from("mfa_recovery_codes").delete().eq("user_id", auth.userId);

  const { error: insertError } = await auth.supabase.from("mfa_recovery_codes").insert(
    codes.map((code) => ({
      user_id: auth.userId,
      code_hash: hashRecoveryCode(code),
    })),
  );

  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard/settings");
  return { success: "Recovery codes generated.", recoveryCodes: codes };
}

export async function regenerateRecoveryCodesAction(): Promise<AccountSettingsFormState> {
  return storeMfaRecoveryCodesAction();
}

export async function signOutAllDevicesAction(): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  await auth.supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .is("revoked_at", null);

  await auth.supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

export async function revokeSessionAction(sessionId: string): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const { error } = await auth.supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", auth.userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Session revoked." };
}

export async function resetProfileAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "RESET") return { error: 'Type RESET to confirm profile reset.' };

  const { error } = await auth.supabase.rpc("reset_own_profile");
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: "Profile reset to defaults." };
}

export async function deleteAccountAction(
  _prev: AccountSettingsFormState,
  formData: FormData,
): Promise<AccountSettingsFormState> {
  const auth = await getAuthUser();
  if (!auth) return { error: "You must be logged in." };

  const confirm = String(formData.get("confirm_username") ?? "").trim();
  if (!confirm) return { error: "Enter your username to confirm deletion." };

  const { error } = await auth.supabase.rpc("delete_own_account", {
    p_confirm_username: confirm,
  });

  if (error) return { error: error.message };

  await auth.supabase.auth.signOut();
  redirect("/");
}

export async function getAccountPreferencesAction() {
  const auth = await getAuthUser();
  if (!auth) return null;
  return getAccountPreferences(auth.userId);
}
