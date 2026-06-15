import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent } from "@/lib/types/activity";

export async function getActivityFeed(profileId: string, limit = 10): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ActivityEvent[];
}

export async function logActivity(
  profileId: string,
  eventType: ActivityEvent["event_type"],
  title: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  await supabase.from("activity_events").insert({
    profile_id: profileId,
    event_type: eventType,
    title,
    metadata,
  });
}
