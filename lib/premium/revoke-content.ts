import { revalidatePath } from "next/cache";
import { isPremiumFont } from "@/lib/premium/fonts";
import { PLAN_DEFINITIONS } from "@/lib/premium/plans";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

const FREE = PLAN_DEFINITIONS.free.entitlements;

function requireAdmin() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for premium content cleanup.");
  }
  return admin;
}

type SettingsRow = {
  page_id: string | null;
  font_family: string | null;
  bio_font_family: string | null;
  enter_gate_font_family: string | null;
  music_playlist_mode: boolean | null;
  music_shuffle: boolean | null;
};

export async function hasPremiumContent(userId: string): Promise<boolean> {
  const supabase = requireAdmin();
  const [
    { count: pageCount },
    { count: trackCount },
    { count: scheduleCount },
    { data: settingsRows },
    { count: featuredCount },
  ] = await Promise.all([
    supabase
      .from("profile_pages")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId),
    supabase
      .from("profile_music_tracks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .is("page_id", null),
    supabase
      .from("profile_preset_schedules")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId),
    supabase
      .from("profile_settings")
      .select(
        "page_id, font_family, bio_font_family, enter_gate_font_family, music_playlist_mode, music_shuffle",
      )
      .eq("profile_id", userId),
    supabase
      .from("featured_blocks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .is("page_id", null),
  ]);

  if ((pageCount ?? 0) > 0) return true;
  if ((trackCount ?? 0) > FREE.max_music_tracks) return true;
  if ((scheduleCount ?? 0) > 0) return true;
  if ((featuredCount ?? 0) > FREE.max_featured_blocks) return true;

  for (const row of (settingsRows as SettingsRow[] | null) ?? []) {
    if (row.music_playlist_mode || row.music_shuffle) return true;
    if (row.font_family && isPremiumFont(row.font_family)) return true;
    if (row.bio_font_family && isPremiumFont(row.bio_font_family)) return true;
    if (row.enter_gate_font_family && isPremiumFont(row.enter_gate_font_family)) return true;
  }

  return false;
}

export async function cleanupPremiumContent(userId: string): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();

  await supabase.from("profile_preset_schedules").delete().eq("profile_id", userId);

  await supabase.from("profile_pages").delete().eq("profile_id", userId);

  const { data: tracks } = await supabase
    .from("profile_music_tracks")
    .select("id, url, title, sort_order")
    .eq("profile_id", userId)
    .is("page_id", null)
    .order("sort_order", { ascending: true });

  const keptTrack = tracks?.[0] ?? null;
  const extraTrackIds = (tracks ?? [])
    .slice(FREE.max_music_tracks)
    .map((track) => track.id);

  if (extraTrackIds.length > 0) {
    await supabase.from("profile_music_tracks").delete().in("id", extraTrackIds);
  }

  const { data: settingsRows } = await supabase
    .from("profile_settings")
    .select(
      "page_id, font_family, bio_font_family, enter_gate_font_family, music_playlist_mode, music_shuffle, music_autoplay_next, music_default_track_id, last_applied_schedule_id, active_edit_page_id, music_url, music_title",
    )
    .eq("profile_id", userId);

  for (const row of settingsRows ?? []) {
    const updates: Record<string, unknown> = {
      music_playlist_mode: false,
      music_shuffle: false,
      music_autoplay_next: false,
      music_default_track_id: keptTrack?.id ?? null,
      last_applied_schedule_id: null,
      active_edit_page_id: null,
      updated_at: now,
    };

    if (row.font_family && isPremiumFont(String(row.font_family))) {
      updates.font_family = DEFAULT_SETTINGS.font_family;
    }
    if (row.bio_font_family && isPremiumFont(String(row.bio_font_family))) {
      updates.bio_font_family = "";
    }
    if (row.enter_gate_font_family && isPremiumFont(String(row.enter_gate_font_family))) {
      updates.enter_gate_font_family = "";
    }

    if (!row.page_id && keptTrack) {
      updates.music_url = keptTrack.url;
      updates.music_title = keptTrack.title || "Profile Track";
    }

    let query = supabase.from("profile_settings").update(updates).eq("profile_id", userId);
    if (row.page_id) {
      query = query.eq("page_id", row.page_id);
    } else {
      query = query.is("page_id", null);
    }
    await query;
  }

  const { data: featured } = await supabase
    .from("featured_blocks")
    .select("id")
    .eq("profile_id", userId)
    .is("page_id", null)
    .order("sort_order", { ascending: true });

  const extraFeaturedIds = (featured ?? [])
    .slice(FREE.max_featured_blocks)
    .map((block) => block.id);

  if (extraFeaturedIds.length > 0) {
    await supabase.from("featured_blocks").delete().in("id", extraFeaturedIds);
  }

  await supabase.from("premium_entitlements").delete().eq("profile_id", userId);
}

export async function revalidateAfterPremiumRevoke(userId: string): Promise<void> {
  const supabase = requireAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/music");
  revalidatePath("/dashboard/premium");
  revalidatePath("/dashboard/preset-schedules");
  revalidatePath("/dashboard/customize");

  if (!profile?.username) return;

  revalidatePath(`/${profile.username}`);
  revalidatePath(`/${profile.username}`, "layout");
}
