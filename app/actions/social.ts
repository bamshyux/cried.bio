"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { clearActivityFeed } from "@/lib/data/activity";
import { createNotification } from "@/lib/data/notifications";
import { logActivity } from "@/lib/data/activity";
import { syncAllMilestoneBadges } from "@/lib/badges/sync-milestones";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import { formatSchemaError } from "@/lib/db/schema";
import type { SocialFormState } from "@/lib/types/social";
import { createClient } from "@/lib/supabase/server";

export async function followUserAction(targetId: string): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (userId === targetId) return { error: "You cannot follow yourself." };

  const supabase = await createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: userId,
    following_id: targetId,
  });

  if (error) return { error: error.message };

  const { data: actor } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  await createNotification({
    userId: targetId,
    type: "follow",
    title: "New follower",
    body: `${actor?.display_name || actor?.username || "Someone"} followed you`,
    actorId: userId,
  });

  await syncAllMilestoneBadges(targetId);
  await revalidateUserProfile(targetId);
  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Following!" };
}

export async function unfollowUserAction(targetId: string): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);

  await revalidateUserProfile(targetId);
  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Unfollowed." };
}

export async function sendFriendRequestAction(targetId: string): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };
  if (userId === targetId) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.from("friend_requests").insert({
    sender_id: userId,
    receiver_id: targetId,
    status: "pending",
  });

  if (error) return { error: error.message };

  const { data: actor } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  await createNotification({
    userId: targetId,
    type: "friend_request",
    title: "Friend request",
    body: `${actor?.display_name || actor?.username || "Someone"} sent you a friend request`,
    actorId: userId,
  });

  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Friend request sent." };
}

export async function respondFriendRequestAction(requestId: string, accept: boolean): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .maybeSingle();

  if (!request) return { error: "Request not found." };

  await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId);

  if (accept) {
    const [userA, userB] =
      request.sender_id < request.receiver_id
        ? [request.sender_id, request.receiver_id]
        : [request.receiver_id, request.sender_id];

    await supabase.from("friendships").upsert({ user_a: userA, user_b: userB });
    await logActivity(request.sender_id, "friend_added", "Made a new friend");
    await logActivity(request.receiver_id, "friend_added", "Made a new friend");

    await createNotification({
      userId: request.sender_id,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: "Your friend request was accepted",
      actorId: userId,
    });
  }

  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: accept ? "Friend added!" : "Request declined." };
}

export async function removeFriendAction(friendId: string): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const [userA, userB] = userId < friendId ? [userId, friendId] : [friendId, userId];
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("user_a", userA).eq("user_b", userB);

  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Friend removed." };
}

export async function updateSocialSettingsAction(
  _prev: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const patch = await omitUnsupportedSettingsColumns({
    friends_visibility: String(formData.get("friends_visibility") ?? "public"),
    show_follow_counts: formData.get("show_follow_counts") === "true",
    show_activity: formData.get("show_activity") === "true",
  });

  const supabase = await createClient();
  const { error } = await supabase.from("profile_settings").update(patch).eq("profile_id", userId);
  if (error) return { error: formatSchemaError(error.message) };

  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Social settings saved." };
}

export async function clearRecentActivityAction(): Promise<SocialFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const result = await clearActivityFeed(userId);
  if (result.error) return { error: result.error };

  await revalidateUserProfile(userId, ["/dashboard/social"]);
  return { success: "Recent activity cleared." };
}
