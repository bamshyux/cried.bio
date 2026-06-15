export type ActivityEventType =
  | "profile_created"
  | "badge_earned"
  | "profile_updated"
  | "link_added"
  | "friend_added"
  | "milestone_reached";

export type ActivityEvent = {
  id: string;
  profile_id: string;
  event_type: ActivityEventType;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
