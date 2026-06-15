"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { isGuestbookBanned } from "@/lib/data/guestbook";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { createNotification } from "@/lib/data/notifications";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import { formatSchemaError } from "@/lib/db/schema";
import type { GuestbookFormState } from "@/lib/types/guestbook";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_MS = 5 * 60 * 1000;

export async function updateGuestbookSettingsAction(
  _prev: GuestbookFormState,
  formData: FormData,
): Promise<GuestbookFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const patch = await omitUnsupportedSettingsColumns({
    guestbook_enabled: formData.get("guestbook_enabled") === "true",
    guestbook_approval_required: formData.get("guestbook_approval_required") === "true",
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(patch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };
  await revalidateUserProfile(userId, ["/dashboard/guestbook"]);
  return { success: "Guestbook settings saved." };
}

export async function postGuestbookEntryAction(
  _prev: GuestbookFormState,
  formData: FormData,
): Promise<GuestbookFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in to sign the guestbook." };

  const profileId = String(formData.get("profile_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!profileId || !message) return { error: "Message is required." };
  if (message.length > 500) return { error: "Message is too long." };
  if (profileId === userId) return { error: "You cannot sign your own guestbook." };

  const moderationError = await rejectIfModerated(message, "guestbook_message", userId);
  if (moderationError) return { error: moderationError };

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("profile_settings")
    .select("guestbook_enabled, guestbook_approval_required")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!settings?.guestbook_enabled) return { error: "Guestbook is disabled." };
  if (await isGuestbookBanned(profileId, userId)) return { error: "You are banned from this guestbook." };

  const { data: recent } = await supabase
    .from("guestbook_entries")
    .select("created_at")
    .eq("profile_id", profileId)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < RATE_LIMIT_MS) {
    return { error: "Please wait before posting again." };
  }

  const needsApproval = settings.guestbook_approval_required ?? true;
  const { error } = await supabase.from("guestbook_entries").insert({
    profile_id: profileId,
    author_id: userId,
    message,
    is_approved: !needsApproval,
  });

  if (error) return { error: error.message };

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  await createNotification({
    userId: profileId,
    type: "guestbook",
    title: "New guestbook message",
    body: `${author?.display_name || author?.username || "Someone"} signed your guestbook`,
    actorId: userId,
    data: {
      author_name: author?.display_name || author?.username || "Someone",
      message_preview: message.length > 120 ? `${message.slice(0, 117)}...` : message,
    },
  });

  await revalidateUserProfile(profileId, ["/dashboard/guestbook"]);
  return { success: needsApproval ? "Message submitted for approval." : "Message posted!" };
}

export async function approveGuestbookEntryAction(entryId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase
    .from("guestbook_entries")
    .update({ is_approved: true })
    .eq("id", entryId)
    .eq("profile_id", userId);

  await revalidateUserProfile(userId, ["/dashboard/guestbook"]);
  return { success: true };
}

export async function deleteGuestbookEntryAction(entryId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase
    .from("guestbook_entries")
    .delete()
    .eq("id", entryId)
    .or(`profile_id.eq.${userId},author_id.eq.${userId}`);

  await revalidateUserProfile(userId, ["/dashboard/guestbook"]);
  return { success: true };
}

export async function banGuestbookUserAction(bannedUserId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase.from("guestbook_bans").upsert({
    profile_id: userId,
    banned_user_id: bannedUserId,
  });

  await revalidateUserProfile(userId, ["/dashboard/guestbook"]);
  return { success: true };
}

export async function reactGuestbookAction(entryId: string, emoji: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("guestbook_reactions")
    .select("id")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("guestbook_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("guestbook_reactions").insert({ entry_id: entryId, user_id: userId, emoji });
  }

  return { success: true };
}
