"use server";

import { revalidatePath } from "next/cache";
import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import { revokePremiumAccess } from "@/lib/premium/sync";
import { logAdminAudit, logUserTimelineEvent } from "@/lib/admin/audit";
import { requireAdminAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminFormState, AnnouncementType } from "@/lib/types/admin";

async function guard(minRole: "admin" | "owner" = "admin") {
  const access = await requireAdminAccess(minRole);
  if ("error" in access) return { error: access.error } as const;
  return { access } as const;
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

function revalidateSitewideBanner() {
  revalidatePath("/", "layout");
}

export async function adminUpdateUserAction(
  userId: string,
  updates: {
    role?: string;
    is_banned?: boolean;
    is_disabled?: boolean;
    premium_tier?: string;
    premium_expires_at?: string | null;
    banned_reason?: string;
  },
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const payload: Record<string, unknown> = { ...updates };
  if (updates.is_banned) payload.banned_at = new Date().toISOString();
  if (updates.role === "admin") payload.is_admin = true;
  if (updates.role === "user") payload.is_admin = false;

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: userId,
    action: "user_updated",
    details: updates,
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  return { success: "User updated." };
}

export async function adminUpdateUidAction(
  userId: string,
  uid: number,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  if (!Number.isSafeInteger(uid) || uid < 1) {
    return { error: "UID must be a positive whole number." };
  }

  const supabase = await db();
  const { data: existing } = await supabase
    .from("profiles")
    .select("uid, username")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) return { error: "User not found." };
  if (existing.uid === uid) return { success: "UID unchanged." };

  // Must use the logged-in admin session — service role calls have no auth.uid(),
  // so admin_update_profile_uid would always raise Forbidden.
  const authClient = await createClient();
  let { error } = await authClient.rpc("admin_update_profile_uid", {
    p_user_id: userId,
    p_uid: uid,
  });

  if (error?.message === "Forbidden") {
    const admin = createAdminClient();
    if (admin) {
      const { data: conflict } = await admin
        .from("profiles")
        .select("id")
        .eq("uid", uid)
        .neq("id", userId)
        .maybeSingle();

      if (conflict) return { error: "That UID is already taken." };

      const { error: updateError } = await admin
        .from("profiles")
        .update({ uid, updated_at: new Date().toISOString() })
        .eq("id", userId);

      error = updateError;
    }
  }

  if (error) {
    const message =
      error.message.includes("admin_update_profile_uid") ||
      error.message.includes("Could not find the function")
        ? `${error.message} Run supabase/v46_admin_uid_update.sql in the Supabase SQL Editor.`
        : error.message;
    return { error: message };
  }

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: userId,
    action: "uid_changed",
    details: { from: existing.uid, to: uid },
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  if (existing.username) revalidatePath(`/${existing.username}`);

  return { success: "UID updated." };
}

export async function adminGrantPremiumAction(
  userId: string,
  tier: string,
  expiresAt: string | null,
): Promise<AdminFormState> {
  const result = await adminUpdateUserAction(userId, {
    premium_tier: tier,
    premium_expires_at: expiresAt,
  });
  if (result.error) return result;

  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  await logUserTimelineEvent({
    userId,
    eventType: "premium_granted",
    title: `Granted ${tier} premium`,
    metadata: { expires_at: expiresAt },
  });
  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: userId,
    action: "premium_granted",
    details: { tier, expires_at: expiresAt },
  });

  await syncPremiumBadge(userId, tier !== "free");

  return { success: "Premium updated." };
}

export async function adminRevokePremiumAction(userId: string): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  try {
    await revokePremiumAccess(userId, "expired", { force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke premium.";
    return { error: message };
  }

  await logUserTimelineEvent({
    userId,
    eventType: "premium_revoked",
    title: "Premium revoked",
  });
  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    targetUserId: userId,
    action: "premium_revoked",
    details: {},
  });

  revalidatePath("/dashboard/admin/premium");
  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);

  return { success: "Premium revoked and premium content removed." };
}

export async function adminBanUserAction(userId: string, reason: string): Promise<AdminFormState> {
  const result = await adminUpdateUserAction(userId, { is_banned: true, banned_reason: reason });
  if (result.error) return result;

  await logUserTimelineEvent({
    userId,
    eventType: "account_banned",
    title: "Account banned",
    metadata: { reason },
  });

  return { success: "User banned." };
}

export async function adminDisableUserAction(userId: string): Promise<AdminFormState> {
  return adminUpdateUserAction(userId, { is_disabled: true });
}

export async function createAnnouncementAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const announcement_type = String(formData.get("announcement_type") ?? "info") as AnnouncementType;
  const is_active = formData.get("is_active") === "true";

  if (!title) return { error: "Title is required." };

  const supabase = await db();
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    announcement_type,
    is_active,
    created_by: gate.access.userId,
  });
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "announcement_created",
    details: { title, announcement_type },
  });

  revalidatePath("/dashboard/admin/announcements");
  revalidateSitewideBanner();
  return { success: "Announcement created." };
}

export async function toggleAnnouncementAction(id: string, isActive: boolean): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase
    .from("announcements")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: isActive ? "announcement_activated" : "announcement_deactivated",
    details: { id, is_active: isActive },
  });

  revalidatePath("/dashboard/admin/announcements");
  revalidateSitewideBanner();
  return { success: isActive ? "Announcement activated." : "Announcement deactivated." };
}

export async function deleteAnnouncementAction(id: string, _formData?: FormData): Promise<void> {
  const gate = await guard();
  if ("error" in gate) throw new Error(gate.error);

  const supabase = await db();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/announcements");
  revalidateSitewideBanner();
}

export async function sendAdminNotificationAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  if (!title) return { error: "Title is required." };

  const supabase = await db();
  let userId: string | null = null;

  if (username) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();
    if (!profile) return { error: "User not found." };
    userId = profile.id;
  }

  const { error } = await supabase.from("admin_notifications").insert({
    user_id: userId,
    title,
    body,
    created_by: gate.access.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/notifications");
  return { success: userId ? "Notification sent to user." : "Broadcast notification sent." };
}

export async function updatePlatformSettingsAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard("owner");
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      maintenance_mode: formData.get("maintenance_mode") === "true",
      read_only_mode: formData.get("read_only_mode") === "true",
      global_banner: String(formData.get("global_banner") ?? ""),
      global_banner_type: String(formData.get("global_banner_type") ?? "info"),
      force_password_reset: formData.get("force_password_reset") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "platform_settings_updated",
  });

  revalidatePath("/dashboard/admin/owner");
  revalidateSitewideBanner();
  return { success: "Platform settings saved." };
}

export async function addReservedUsernameAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard("owner");
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Username is required." };

  const supabase = await db();
  const { error } = await supabase.from("reserved_usernames").insert({
    username,
    reason: String(formData.get("reason") ?? ""),
    created_by: gate.access.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/owner");
  return { success: "Reserved username added." };
}

export async function removeReservedUsernameAction(username: string, _formData?: FormData): Promise<void> {
  const gate = await guard("owner");
  if ("error" in gate) throw new Error(gate.error);

  const supabase = await db();
  const { error } = await supabase.from("reserved_usernames").delete().eq("username", username);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/owner");
}

export async function updateBadgeAdminAction(
  badgeId: string,
  updates: Record<string, unknown>,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase.from("badges").update(updates).eq("id", badgeId);
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "badge_updated",
    details: { badgeId, ...updates },
  });

  revalidatePath("/dashboard/admin/badges");
  return { success: "Badge updated." };
}

export async function deleteBadgeAdminAction(badgeId: string): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase.from("badges").delete().eq("id", badgeId).eq("is_system", false);
  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "badge_deleted",
    details: { badgeId },
  });

  revalidatePath("/dashboard/admin/badges");
  return { success: "Badge deleted." };
}

export async function adminForceLogoutAllAction(
  _prev: AdminFormState,
  _formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard("owner");
  if ("error" in gate) return { error: gate.error };

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Service role key required for force logout all users." };
  }

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "force_logout_all_requested",
  });

  return {
    success:
      "Logout request logged. Configure Supabase Auth session revocation via dashboard or extend this action with auth.admin.signOut.",
  };
}

export async function addLandingFeaturedProfileAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Username is required." };

  const supabase = await db();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: "Profile not found or not published." };

  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const { error } = await supabase.from("landing_featured_profiles").upsert(
    {
      profile_id: profile.id,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_active: true,
    },
    { onConflict: "profile_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/landing");
  revalidatePath("/");
  return { success: `@${username} added to featured profiles.` };
}

export async function removeLandingFeaturedProfileAction(id: string, _formData?: FormData): Promise<void> {
  const gate = await guard();
  if ("error" in gate) throw new Error(gate.error);

  const supabase = await db();
  const { error } = await supabase.from("landing_featured_profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/landing");
  revalidatePath("/");
}

export async function addLandingTestimonialAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const quote = String(formData.get("quote") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();
  if (!quote || !authorName) return { error: "Quote and author name are required." };

  const supabase = await db();
  const { error } = await supabase.from("landing_testimonials").insert({
    quote,
    author_name: authorName,
    author_title: String(formData.get("author_title") ?? "").trim(),
    author_username: String(formData.get("author_username") ?? "").trim().toLowerCase() || null,
    author_avatar_url: String(formData.get("author_avatar_url") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") !== "false",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/landing");
  revalidatePath("/");
  return { success: "Testimonial added." };
}

export async function deleteLandingTestimonialAction(id: string): Promise<void> {
  const gate = await guard();
  if ("error" in gate) throw new Error(gate.error);

  const supabase = await db();
  const { error } = await supabase.from("landing_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/landing");
  revalidatePath("/");
}

export async function toggleLandingTestimonialAction(id: string, isActive: boolean): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase.from("landing_testimonials").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/landing");
  revalidatePath("/");
  return { success: "Testimonial updated." };
}
