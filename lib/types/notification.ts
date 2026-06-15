export type NotificationType =
  | "follow"
  | "friend_request"
  | "friend_accepted"
  | "badge_earned"
  | "guestbook"
  | "milestone";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_id: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};
