"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeMusicAction, saveMusicAction, updateSettingsAction } from "@/app/actions/settings";
import type { ProfileSettings, SettingsFormState } from "@/lib/types/settings";
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
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";

const initial: SettingsFormState = {};

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

export function MusicEditor({
  settings,
  musicTitleSupported = true,
}: {
  settings: ProfileSettings;
  musicTitleSupported?: boolean;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [musicUseAccent, setMusicUseAccent] = useState(!settings.music_player_color?.trim());
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  useSettingsRefresh(state);

  useEffect(() => {
    setMusicUseAccent(!settings.music_player_color?.trim());
  }, [settings.updated_at, settings.music_player_color]);

  const handleMusicUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploadPending(true);
    setUploadError(undefined);
    setUploadSuccess(undefined);

    try {
      const url = await uploadMusicToStorage(file);
      const result = await saveMusicAction(url);

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

  const handleRemove = () => {
    startRemove(async () => {
      const result = await removeMusicAction();
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

  return (
    <>
      <PageHeader title="Music" description="Upload profile music and configure playback." />

      <div className="space-y-6">
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Upload music</h2>

          {settings.music_url && (
            <div className="mb-4 space-y-2 border-b border-white/[0.06] pb-4">
              <p className="text-xs text-neutral-500">Current track</p>
              <audio src={settings.music_url} controls className="w-full accent-[#fafafa]" />
              <RemoveMediaButton
                label="Remove music"
                disabled={isRemoving || uploadPending}
                onClick={handleRemove}
              />
            </div>
          )}

          <div className="space-y-3">
            <label htmlFor="music" className={labelClassName}>
              Audio file (max 20 MB)
            </label>
            <input
              key={fileInputKey}
              id="music"
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.webm"
              disabled={uploadPending}
              onChange={(event) => {
                void handleMusicUpload(event.target.files?.[0]);
              }}
              className={fileInputClassName}
            />
            <p className="text-xs text-neutral-600">
              {uploadPending
                ? "Uploading music..."
                : "Choose a file to upload or replace your current track."}
            </p>
            <FormFeedback error={uploadError} success={uploadSuccess} />
          </div>
        </div>

        <div className={cardClassName}>
          <form action={formAction} data-dashboard-primary-form className="space-y-5">
            <input type="hidden" name="_section" value="music" />
            <div>
              <label htmlFor="music_title" className={labelClassName}>Song title</label>
              {musicTitleSupported ? (
                <input
                  id="music_title"
                  name="music_title"
                  type="text"
                  defaultValue={settings.music_title}
                  placeholder="Track name"
                  className="bf-input w-full"
                />
              ) : (
                <>
                  <input
                    id="music_title"
                    type="text"
                    disabled
                    value=""
                    placeholder="Run supabase/v4_music_title.sql to enable"
                    className="bf-input w-full cursor-not-allowed opacity-50"
                  />
                  <p className="mt-1.5 text-xs text-amber-500/90">
                    Song title requires the <code className="font-mono">music_title</code> column.
                    Run <code className="font-mono">supabase/v4_music_title.sql</code> in Supabase, then restart the dev server.
                  </p>
                </>
              )}
            </div>
            <SliderField name="music_volume" label="Volume" min={0} max={100} defaultValue={settings.music_volume} unit="%" />
            <ToggleField
              name="music_use_accent"
              label="Use profile accent color"
              description="When off, pick a custom color for the player button and volume slider"
              defaultChecked={musicUseAccent}
              onCheckedChange={setMusicUseAccent}
            />
            {!musicUseAccent && (
              <ColorField
                name="music_player_color"
                label="Player accent color"
                defaultValue={settings.music_player_color || settings.accent_color}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField name="music_autoplay" label="Autoplay" defaultChecked={settings.music_autoplay} />
              <ToggleField name="music_loop" label="Loop" defaultChecked={settings.music_loop} />
            </div>
            <FormFeedback error={state.error} success={state.success} />
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
  musicTitleSupported = true,
}: {
  settings: ProfileSettings;
  musicTitleSupported?: boolean;
}) {
  return <MusicEditor settings={settings} musicTitleSupported={musicTitleSupported} />;
}
