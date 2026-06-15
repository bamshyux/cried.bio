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

export async function getActivityCount(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_events")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);

  if (error) return 0;
  return count ?? 0;
}

export async function clearActivityFeed(profileId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_events").delete().eq("profile_id", profileId);
  if (error) return { error: error.message };
  return {};
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
