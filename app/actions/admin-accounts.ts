"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { getFounderUserId } from "@/lib/badges/founder";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { deleteAllUserStorage } from "@/lib/storage/delete-user-storage";

const DELETE_CONFIRM_PHRASE = "I Confirm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminAccountFormState, AdminAccountSummary } from "@/lib/types/admin-account";

async function guardSuperAdmin() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error } as const;
  return { auth } as const;
}

function rpcSetupHint(message: string) {
  if (
    message.includes("admin_list_accounts") ||
    message.includes("admin_update_account") ||
    message.includes("admin_delete_account") ||
    message.includes("Could not find the function")
  ) {
    return `${message} Run supabase/v20_admin_accounts.sql in the Supabase SQL Editor.`;
  }
  return message;
}

type AdminAccountRow = {
  id: string;
  email: string | null;
  uid: number | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_admin: boolean;
  premium_tier: string;
  premium_expires_at: string | null;
  created_at: string;
};

export async function listAdminAccountsAction(): Promise<{
  accounts?: AdminAccountSummary[];
  error?: string;
}> {
  const gate = await guardSuperAdmin();
  if ("error" in gate) return { error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_accounts");

  if (error) {
    return { error: rpcSetupHint(error.message) };
  }

  const accounts: AdminAccountSummary[] = ((data ?? []) as AdminAccountRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    uid: row.uid,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    banner_url: row.banner_url,
    is_admin: !!row.is_admin,
    premium_tier: row.premium_tier ?? "free",
    premium_expires_at: row.premium_expires_at,
    created_at: row.created_at,
  }));

  return { accounts };
}

export async function updateAdminAccountAction(
  _prev: AdminAccountFormState,
  formData: FormData,
): Promise<AdminAccountFormState> {
  const gate = await guardSuperAdmin();
  if ("error" in gate) return { error: gate.error };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Missing account id." };

  const usernameRaw = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const isAdmin = formData.get("is_admin") === "true";
  const premiumTier = String(formData.get("premium_tier") ?? "free");
  const premiumExpiresRaw = String(formData.get("premium_expires_at") ?? "").trim();

  if (!usernameRaw) return { error: "Username is required." };

  const username = normalizeUsername(usernameRaw);
  if (!isValidUsername(username)) {
    return { error: "Username must be 3–20 characters: lowercase letters, numbers, underscores." };
  }

  const supabase = await createClient();

  const { data: existingRows } = await supabase.rpc("admin_list_accounts");
  const existing = ((existingRows ?? []) as AdminAccountRow[]).find((row) => row.id === userId);
  if (!existing) return { error: "Account not found." };

  const { error } = await supabase.rpc("admin_update_account", {
    p_user_id: userId,
    p_username: username,
    p_display_name: displayName,
    p_bio: bio,
    p_is_admin: isAdmin,
    p_premium_tier: premiumTier === "premium" ? "premium" : "free",
    p_premium_expires_at: premiumExpiresRaw ? new Date(premiumExpiresRaw).toISOString() : null,
  });

  if (error) return { error: rpcSetupHint(error.message) };

  revalidatePath("/dashboard/accounts");
  if (existing.username) revalidatePath(`/${existing.username}`);
  if (username !== existing.username) revalidatePath(`/${username}`);

  return { success: "Account updated." };
}

export async function deleteAdminAccountAction(
  _prev: AdminAccountFormState,
  formData: FormData,
): Promise<AdminAccountFormState> {
  const gate = await guardSuperAdmin();
  if ("error" in gate) return { error: gate.error };

  const userId = String(formData.get("user_id") ?? "").trim();
  const confirmPhrase = String(formData.get("confirm_phrase") ?? "").trim();

  if (!userId) return { error: "Missing account id." };
  if (userId === gate.auth.userId) return { error: "You cannot delete your own account from here." };

  const founderId = await getFounderUserId();
  if (founderId && userId === founderId) return { error: "The founder account cannot be deleted." };

  if (confirmPhrase !== DELETE_CONFIRM_PHRASE) {
    return { error: `Type "${DELETE_CONFIRM_PHRASE}" to confirm deletion.` };
  }

  const supabase = await createClient();
  const { data: existingRows } = await supabase.rpc("admin_list_accounts");
  const profile = ((existingRows ?? []) as AdminAccountRow[]).find((row) => row.id === userId);

  if (!profile?.username) return { error: "Account not found." };

  const admin = createAdminClient();
  if (admin) {
    await deleteAllUserStorage(admin, userId);
  }

  const { error: deleteError } = await supabase.rpc("admin_delete_account", {
    p_user_id: userId,
    p_confirm_phrase: confirmPhrase,
  });

  if (deleteError) return { error: rpcSetupHint(deleteError.message) };

  revalidatePath("/dashboard/accounts");
  revalidatePath(`/${profile.username}`);

  const storageNote = admin ? "" : " (Add SUPABASE_SERVICE_ROLE_KEY to also purge uploaded files.)";
  return { success: `Deleted @${profile.username} and all associated data.${storageNote}` };
}
