import { createClient } from "@/lib/supabase/server";
import type { SocialProfile } from "@/lib/types/social";

export async function getFollowCounts(profileId: string) {
  const supabase = await createClient();
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowers(profileId: string, limit = 50): Promise<SocialProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
    .eq("following_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const f = row.follower as SocialProfile | SocialProfile[] | null;
    return Array.isArray(f) ? f[0] : f;
  }).filter(Boolean) as SocialProfile[];
}

export async function getFollowing(profileId: string, limit = 50): Promise<SocialProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
    .eq("follower_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const f = row.following as SocialProfile | SocialProfile[] | null;
    return Array.isArray(f) ? f[0] : f;
  }).filter(Boolean) as SocialProfile[];
}

export async function getFriends(profileId: string, limit = 24): Promise<SocialProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${profileId},user_b.eq.${profileId}`)
    .limit(limit);

  if (!data?.length) return [];

  const friendIds = data.map((f) => (f.user_a === profileId ? f.user_b : f.user_a));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", friendIds);

  return (profiles ?? []) as SocialProfile[];
}

export async function getPendingFriendRequests(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friend_requests")
    .select(`
      *,
      sender:profiles!friend_requests_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getFriendshipStatus(userA: string, userB: string) {
  const supabase = await createClient();
  const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
  const { data: friendship } = await supabase
    .from("friendships")
    .select("user_a")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  if (friendship) return "friends" as const;

  const { data: outgoing } = await supabase
    .from("friend_requests")
    .select("status")
    .eq("sender_id", userA)
    .eq("receiver_id", userB)
    .eq("status", "pending")
    .maybeSingle();
  if (outgoing) return "pending_sent" as const;

  const { data: incoming } = await supabase
    .from("friend_requests")
    .select("status")
    .eq("sender_id", userB)
    .eq("receiver_id", userA)
    .eq("status", "pending")
    .maybeSingle();
  if (incoming) return "pending_received" as const;

  return "none" as const;
}
