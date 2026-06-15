import { createClient } from "@/lib/supabase/server";
import type { GuestbookEntry } from "@/lib/types/guestbook";

export async function getGuestbookEntries(profileId: string, options?: { ownerView?: boolean; limit?: number }) {
  const supabase = await createClient();
  let query = supabase
    .from("guestbook_entries")
    .select(`
      *,
      author:profiles!guestbook_entries_author_id_fkey(username, display_name, avatar_url)
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (!options?.ownerView) query = query.eq("is_approved", true);

  const { data, error } = await query;
  if (error) return [];

  const entries = (data ?? []) as (GuestbookEntry & { author: GuestbookEntry["author"] })[];

  if (entries.length === 0) return [];

  const entryIds = entries.map((e) => e.id);
  const { data: reactions } = await supabase
    .from("guestbook_reactions")
    .select("*")
    .in("entry_id", entryIds);

  return entries.map((entry) => ({
    ...entry,
    reactions: (reactions ?? []).filter((r) => r.entry_id === entry.id),
  })) as GuestbookEntry[];
}

export async function isGuestbookBanned(profileId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guestbook_bans")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("banned_user_id", userId)
    .maybeSingle();
  return !!data;
}
