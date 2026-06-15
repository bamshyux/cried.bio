"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { getFounderUserId } from "@/lib/badges/founder";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { deleteAllUserStorage } from "@/lib/storage/delete-user-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminAccountFormState, AdminAccountSummary } from "@/lib/types/admin-account";

async function guardSuperAdmin() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error } as const;
  return { auth } as const;
}

async function buildEmailMap(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const map = new Map<string, string>();
  if (!admin) return map;

  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) break;

    for (const user of data.users) {
      if (user.email) map.set(user.id, user.email);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return map;
}

export async function listAdminAccountsAction(): Promise<{
  accounts?: AdminAccountSummary[];
  error?: string;
}> {
  const gate = await guardSuperAdmin();
  if ("error" in gate) return { error: gate.error };

  const admin = createAdminClient();
  if (!admin) return { error: "Server admin client is not configured." };

  const [{ data: profiles, error: profilesError }, emailMap] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, uid, username, display_name, bio, avatar_url, banner_url, is_admin, premium_tier, premium_expires_at, created_at",
      )
      .order("uid", { ascending: true, nullsFirst: false }),
    buildEmailMap(),
  ]);

  if (profilesError) return { error: profilesError.message };

  const accounts: AdminAccountSummary[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: emailMap.get(profile.id) ?? null,
    uid: profile.uid,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url,
    is_admin: !!profile.is_admin,
    premium_tier: profile.premium_tier ?? "free",
    premium_expires_at: profile.premium_expires_at,
    created_at: profile.created_at,
  }));

  return { accounts };
}

export async function updateAdminAccountAction(
  _prev: AdminAccountFormState,
  formData: FormData,
): Promise<AdminAccountFormState> {
  const gate = await guardSuperAdmin();
  if ("error" in gate) return { error: gate.error };

  const admin = createAdminClient();
  if (!admin) return { error: "Server admin client is not configured." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Missing account id." };

  const { data: existing } = await admin.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (!existing) return { error: "Account not found." };

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

  if (username !== existing.username) {
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .maybeSingle();

    if (taken) return { error: "That username is already taken." };
  }

  const update = {
    username,
    display_name: displayName || null,
    bio: bio || "",
    is_admin: isAdmin,
    premium_tier: premiumTier === "premium" ? "premium" : "free",
    premium_expires_at: premiumExpiresRaw ? new Date(premiumExpiresRaw).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) return { error: error.message };

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

  const admin = createAdminClient();
  if (!admin) return { error: "Server admin client is not configured." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const confirmUsername = normalizeUsername(String(formData.get("confirm_username") ?? ""));

  if (!userId) return { error: "Missing account id." };
  if (userId === gate.auth.userId) return { error: "You cannot delete your own account from here." };

  const founderId = await getFounderUserId();
  if (founderId && userId === founderId) return { error: "The founder account cannot be deleted." };

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.username) return { error: "Account not found." };
  if (confirmUsername !== profile.username) {
    return { error: "Confirmation username does not match." };
  }

  await deleteAllUserStorage(admin, userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/dashboard/accounts");
  revalidatePath(`/${profile.username}`);

  return { success: `Deleted @${profile.username} and all associated data.` };
}
