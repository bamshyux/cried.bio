export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
};

export type Friendship = {
  user_a: string;
  user_b: string;
  created_at: string;
};

export type FriendsVisibility = "public" | "friends" | "private";

export type SocialProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_status?: string | null;
};

export type SocialFormState = { error?: string; success?: string };
