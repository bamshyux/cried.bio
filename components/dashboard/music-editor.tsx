"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeMusicTrackAction,
  reorderMusicTracksAction,
  saveMusicTrackAction,
  setDefaultMusicTrackAction,
  updateMusicPlaylistSettingsAction,
} from "@/app/actions/music-tracks";
import { removeMusicAction, saveMusicAction } from "@/app/actions/settings";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import { PremiumLocked, PremiumLockBadge } from "@/components/premium/premium-locked";
import type { MusicTrack } from "@/lib/data/music-tracks";
import type { UserEntitlements } from "@/lib/premium/types";
import type { ProfileSettings } from "@/lib/types/settings";
import { formatUploadSizeLabel, resolveMaxUploadBytes } from "@/lib/uploads/limits";
import { uploadMusicToStorage } from "@/lib/uploads/music-client";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  FormFeedback,
  labelClassName,
  PageHeader,
  RemoveMediaButton,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

type MusicFormState = {
  music_title: string;
  music_volume: number;
  music_use_accent: boolean;
  music_player_color: string;
  music_autoplay: boolean;
  music_loop: boolean;
  music_show_player: boolean;
};

function readMusicForm(settings: ProfileSettings): MusicFormState {
  return {
    music_title: settings.music_title,
    music_volume: settings.music_volume,
    music_use_accent: !settings.music_player_color?.trim(),
    music_player_color: settings.music_player_color || settings.accent_color,
    music_autoplay: settings.music_autoplay,
    music_loop: settings.music_loop,
    music_show_player: settings.music_show_player !== false,
  };
}

export function MusicEditor({
  settings,
  tracks,
  entitlements,
  musicTitleSupported = true,
  pageId,
  contentPage = false,
}: {
  settings: ProfileSettings;
  tracks: MusicTrack[];
  entitlements: UserEntitlements;
  musicTitleSupported?: boolean;
  pageId?: string;
  contentPage?: boolean;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [playlistPending, startPlaylist] = useTransition();
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "music",
    settings,
    readMusicForm,
    "Music settings saved.",
    undefined,
    pageId,
  );
  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [playlistFeedback, setPlaylistFeedback] = useState<{ error?: string; success?: string }>();
  const [playlistSettings, setPlaylistSettings] = useState({
    music_playlist_mode: settings.music_playlist_mode,
    music_shuffle: settings.music_shuffle,
    music_autoplay_next: settings.music_autoplay_next,
  });

  const canPlaylist = entitlements.can_use_playlist;
  const canHideMusicPlayer = canPlaylist;
  const maxTracks = entitlements.max_music_tracks;
  const maxUploadBytes = resolveMaxUploadBytes(entitlements);
  const displayTracks = tracks.length > 0 ? tracks : settings.music_url
    ? [{ id: "legacy", url: settings.music_url, title: settings.music_title || "Profile Track", sort_order: 0 } as MusicTrack]
    : [];

  useEffect(() => {
    setUploadError(undefined);
  }, [settings.music_url, tracks.length]);

  useEffect(() => {
    setPlaylistSettings({
      music_playlist_mode: settings.music_playlist_mode,
      music_shuffle: settings.music_shuffle,
      music_autoplay_next: settings.music_autoplay_next,
    });
  }, [settings.music_playlist_mode, settings.music_shuffle, settings.music_autoplay_next]);

  const handleMusicUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploadPending(true);
    setUploadError(undefined);
    setUploadSuccess(undefined);

    try {
      const url = await uploadMusicToStorage(file, maxUploadBytes);
      const result = canPlaylist && tracks.length > 0
        ? await saveMusicTrackAction({ url, title: file.name.replace(/\.[^.]+$/, ""), pageId })
        : tracks.length >= maxTracks && canPlaylist
          ? { error: `Maximum ${maxTracks} tracks allowed.` }
          : canPlaylist
            ? await saveMusicTrackAction({ url, title: file.name.replace(/\.[^.]+$/, ""), pageId })
            : await saveMusicAction(url, pageId);

      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setUploadSuccess(result.success);
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadPending(false);
      setFileInputKey((key) => key + 1);
    }
  };

  const handleRemoveLegacy = () => {
    startRemove(async () => {
      const result = await removeMusicAction(pageId);
      if (!result.error) {
        setUploadError(undefined);
        setUploadSuccess(result.success);
        setFileInputKey((key) => key + 1);
        router.refresh();
      } else {
        setUploadError(result.error);
      }
    });
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      music_show_player: canHideMusicPlayer ? form.music_show_player : true,
    });
  };

  const savePlaylistSettings = (patch: Parameters<typeof updateMusicPlaylistSettingsAction>[0]) => {
    const previous = playlistSettings;
    setPlaylistSettings((current) => ({ ...current, ...patch }));
    setPlaylistFeedback(undefined);

    startPlaylist(async () => {
      const result = await updateMusicPlaylistSettingsAction(patch, pageId);
      setPlaylistFeedback(result);
      if (result.error) {
        setPlaylistSettings(previous);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Music"
        description={
          contentPage
            ? "Background music for this page only."
            : "Upload profile music, build playlists, and configure playback."
        }
      />

      <div className="space-y-6" data-tour="tour-music">
        <div className={cardClassName}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-white">Tracks</h2>
            <span className="text-xs text-neutral-500">
              {displayTracks.length} / {maxTracks}
            </span>
          </div>

          {displayTracks.length > 0 ? (
            <div className="mb-4 space-y-3 border-b border-white/[0.06] pb-4">
              {displayTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <span className="text-xs text-neutral-600">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{track.title || "Untitled"}</p>
                    <audio src={track.url} controls className="mt-2 w-full accent-[#fafafa]" />
                  </div>
                  <div className="flex gap-2">
                    {canPlaylist && track.id !== "legacy" ? (
                      <button
                        type="button"
                        disabled={playlistPending}
                        onClick={() =>
                          startPlaylist(async () => {
                            await setDefaultMusicTrackAction(track.id, pageId);
                            router.refresh();
                          })
                        }
                        className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:text-white"
                      >
                        Set default
                      </button>
                    ) : null}
                    {track.id === "legacy" ? (
                      <RemoveMediaButton
                        label="Remove"
                        disabled={isRemoving || uploadPending}
                        onClick={handleRemoveLegacy}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={playlistPending || isRemoving}
                        onClick={() =>
                          startPlaylist(async () => {
                            const result = await removeMusicTrackAction(track.id, pageId);
                            if (result.error) {
                              setUploadError(result.error);
                              return;
                            }
                            setUploadError(undefined);
                            setUploadSuccess(result.success);
                            router.refresh();
                          })
                        }
                        className="rounded-lg px-2 py-1 text-xs text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <label htmlFor="music" className={labelClassName}>
              Audio file (max {formatUploadSizeLabel(maxUploadBytes)})
            </label>
            <input
              key={fileInputKey}
              id="music"
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.webm"
              disabled={uploadPending || displayTracks.length >= maxTracks}
              onChange={(event) => {
                void handleMusicUpload(event.target.files?.[0]);
              }}
              className={fileInputClassName}
            />
            <FormFeedback error={uploadError} success={uploadSuccess} />
          </div>
        </div>

        <PremiumLocked allowed={canPlaylist}>
          <div className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-medium text-white">Playlist mode</h2>
              {!canPlaylist ? <PremiumLockBadge /> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                name="music_playlist_mode"
                label="Playlist mode"
                checked={playlistSettings.music_playlist_mode}
                disabled={playlistPending}
                onCheckedChange={(music_playlist_mode) => savePlaylistSettings({ music_playlist_mode })}
              />
              <ToggleField
                name="music_shuffle"
                label="Shuffle"
                checked={playlistSettings.music_shuffle}
                disabled={playlistPending}
                onCheckedChange={(music_shuffle) => savePlaylistSettings({ music_shuffle })}
              />
              <ToggleField
                name="music_autoplay_next"
                label="Autoplay next song"
                checked={playlistSettings.music_autoplay_next}
                disabled={playlistPending}
                onCheckedChange={(music_autoplay_next) => savePlaylistSettings({ music_autoplay_next })}
              />
              <ToggleField
                name="music_loop_playlist"
                label="Loop playlist"
                checked={form.music_loop}
                onCheckedChange={(music_loop) => {
                  patchForm({ music_loop });
                  savePlaylistSettings({ music_loop });
                }}
              />
            </div>
            {canPlaylist && displayTracks.length > 1 ? (
              <button
                type="button"
                disabled={playlistPending}
                className="mt-4 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                onClick={() =>
                  startPlaylist(async () => {
                    await reorderMusicTracksAction(displayTracks.map((t) => t.id).filter((id) => id !== "legacy"), pageId);
                    router.refresh();
                  })
                }
              >
                Save current order
              </button>
            ) : null}
            <FormFeedback {...playlistFeedback} />
          </div>
        </PremiumLocked>

        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-5">
            <div>
              <label htmlFor="music_title" className={labelClassName}>
                Default song title
              </label>
              {musicTitleSupported ? (
                <input
                  id="music_title"
                  type="text"
                  value={form.music_title}
                  onChange={(e) => patchForm({ music_title: e.target.value })}
                  placeholder="Track name"
                  className="bf-input w-full"
                />
              ) : (
                <input
                  id="music_title"
                  type="text"
                  disabled
                  value=""
                  placeholder="Run supabase/v4_music_title.sql to enable"
                  className="bf-input w-full cursor-not-allowed opacity-50"
                />
              )}
            </div>
            <SliderField
              name="music_volume"
              label="Volume"
              min={0}
              max={100}
              value={form.music_volume}
              onChange={(music_volume) => patchForm({ music_volume })}
              unit="%"
            />
            <ToggleField
              name="music_use_accent"
              label="Use profile accent color"
              description="When off, pick a custom color for the player button and volume slider"
              checked={form.music_use_accent}
              onCheckedChange={(music_use_accent) => patchForm({ music_use_accent })}
            />
            {!form.music_use_accent && (
              <ColorField
                name="music_player_color"
                label="Player accent color"
                value={form.music_player_color}
                onChange={(music_player_color) => patchForm({ music_player_color })}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                name="music_autoplay"
                label="Autoplay"
                checked={form.music_autoplay}
                onCheckedChange={(music_autoplay) => patchForm({ music_autoplay })}
              />
              <ToggleField
                name="music_loop"
                label="Loop current track"
                checked={form.music_loop}
                onCheckedChange={(music_loop) => patchForm({ music_loop })}
              />
            </div>
            <ToggleField
              name="music_show_player"
              label="Show player button"
              description={
                canHideMusicPlayer
                  ? "Display the play/pause control in the bottom-right corner of your page"
                  : "Premium Lite is required to hide the player button on your profile"
              }
              checked={canHideMusicPlayer ? form.music_show_player : true}
              disabled={!canHideMusicPlayer}
              badge={!canHideMusicPlayer ? <PremiumLockBadge /> : undefined}
              onCheckedChange={(music_show_player) => {
                if (!canHideMusicPlayer) return;
                patchForm({ music_show_player });
              }}
            />
            <SaveConfirmation success={state.success} error={state.error} />
            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save playback settings"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function MusicPageShell({
  settings,
  tracks,
  entitlements,
  musicTitleSupported = true,
  pageId,
  contentPage = false,
}: {
  settings: ProfileSettings;
  tracks: MusicTrack[];
  entitlements: UserEntitlements;
  musicTitleSupported?: boolean;
  pageId?: string;
  contentPage?: boolean;
}) {
  return (
    <MusicEditor
      settings={settings}
      tracks={tracks}
      entitlements={entitlements}
      musicTitleSupported={musicTitleSupported}
      pageId={pageId}
      contentPage={contentPage}
    />
  );
}
