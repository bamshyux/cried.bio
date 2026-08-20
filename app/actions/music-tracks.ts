"use server";

import { createClient } from "@/lib/supabase/server";
import { requireEntitlement } from "@/lib/premium/entitlements";
import { getMusicTracks } from "@/lib/data/music-tracks";
import { isPlayableAudioUrl } from "@/lib/music/audio-url";
import { revalidateMusicProfilePaths } from "@/lib/music/revalidate";

type ActionResult = { error?: string; success?: string };

async function getUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

function applyPageFilter<T extends { eq: (col: string, val: string) => T; is: (col: string, val: null) => T }>(
  query: T,
  pageId?: string | null,
) {
  return pageId ? query.eq("page_id", pageId) : query.is("page_id", null);
}

export async function saveMusicTrackAction(input: {
  url: string;
  title?: string;
  pageId?: string | null;
}): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_playlist");
  const tracks = await getMusicTracks(userId, input.pageId ?? null);
  const maxTracks = gate.ok ? gate.entitlements.max_music_tracks : 1;

  if (tracks.length >= maxTracks) {
    return {
      error: gate.ok
        ? `Maximum ${maxTracks} tracks allowed.`
        : "Free accounts are limited to 1 track. Upgrade to Premium Lite for playlists.",
    };
  }

  if (!isPlayableAudioUrl(input.url)) {
    return {
      error:
        "That URL is not a playable audio file. Upload MP3, WAV, OGG, or WebM — YouTube/Spotify links cannot be used as tracks.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profile_music_tracks").insert({
    profile_id: userId,
    page_id: input.pageId ?? null,
    url: input.url,
    title: input.title?.trim() || "Untitled Track",
    sort_order: tracks.length,
  });

  if (error) return { error: error.message };

  const allTracks = await getMusicTracks(userId, input.pageId ?? null);
  const firstTrackUrl = allTracks[0]?.url ?? input.url;

  let settingsQuery = supabase
    .from("profile_settings")
    .update({ music_url: firstTrackUrl })
    .eq("profile_id", userId);
  settingsQuery = applyPageFilter(settingsQuery, input.pageId ?? null);
  await settingsQuery;

  await revalidateMusicProfilePaths(userId, input.pageId ?? null);
  return { success: "Track added." };
}

export async function removeMusicTrackAction(
  trackId: string,
  pageId?: string | null,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: track } = await supabase
    .from("profile_music_tracks")
    .select("page_id")
    .eq("id", trackId)
    .eq("profile_id", userId)
    .maybeSingle();

  const resolvedPageId = pageId ?? track?.page_id ?? null;

  const { error } = await supabase
    .from("profile_music_tracks")
    .delete()
    .eq("id", trackId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  const remaining = await getMusicTracks(userId, resolvedPageId);
  let settingsQuery = supabase
    .from("profile_settings")
    .update({ music_url: remaining[0]?.url ?? null })
    .eq("profile_id", userId);
  settingsQuery = applyPageFilter(settingsQuery, resolvedPageId);
  await settingsQuery;

  await revalidateMusicProfilePaths(userId, resolvedPageId);
  return { success: "Track removed." };
}

export async function reorderMusicTracksAction(
  trackIds: string[],
  pageId?: string | null,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_playlist");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  for (let i = 0; i < trackIds.length; i++) {
    await supabase
      .from("profile_music_tracks")
      .update({ sort_order: i })
      .eq("id", trackIds[i])
      .eq("profile_id", userId);
  }

  const orderedTracks = await getMusicTracks(userId, pageId ?? null);
  if (orderedTracks[0]?.url) {
    let settingsQuery = supabase
      .from("profile_settings")
      .update({ music_url: orderedTracks[0].url })
      .eq("profile_id", userId);
    settingsQuery = applyPageFilter(settingsQuery, pageId ?? null);
    await settingsQuery;
  }

  await revalidateMusicProfilePaths(userId, pageId ?? null);
  return { success: "Playlist order saved." };
}

export async function setDefaultMusicTrackAction(
  trackId: string,
  pageId?: string | null,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_playlist");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const { data: track } = await supabase
    .from("profile_music_tracks")
    .select("url, page_id")
    .eq("id", trackId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (!track) return { error: "Track not found." };

  const resolvedPageId = pageId ?? track.page_id ?? null;

  let settingsQuery = supabase
    .from("profile_settings")
    .update({
      music_default_track_id: trackId,
    })
    .eq("profile_id", userId);
  settingsQuery = applyPageFilter(settingsQuery, resolvedPageId);
  const { error } = await settingsQuery;

  if (error) return { error: error.message };

  await revalidateMusicProfilePaths(userId, resolvedPageId);
  return { success: "Default track updated." };
}

export async function updateMusicPlaylistSettingsAction(
  input: {
    music_playlist_mode?: boolean;
    music_shuffle?: boolean;
    music_autoplay_next?: boolean;
    music_loop?: boolean;
    music_autoplay?: boolean;
  },
  pageId?: string | null,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  if (
    input.music_playlist_mode ||
    input.music_shuffle ||
    input.music_autoplay_next
  ) {
    const gate = await requireEntitlement(userId, "can_use_playlist");
    if (!gate.ok) return { error: gate.error };
  }

  const supabase = await createClient();
  let settingsQuery = supabase.from("profile_settings").update(input).eq("profile_id", userId);
  settingsQuery = applyPageFilter(settingsQuery, pageId ?? null);
  const { error } = await settingsQuery;

  if (error) return { error: error.message };

  await revalidateMusicProfilePaths(userId, pageId ?? null);
  return { success: "Playlist settings saved." };
}
