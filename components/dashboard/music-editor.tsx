"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { removeMusicAction, updateSettingsAction, uploadMusicAction } from "@/app/actions/settings";
import type { ProfileSettings, SettingsFormState } from "@/lib/types/settings";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
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

export function MusicEditor({
  settings,
  musicTitleSupported = true,
}: {
  settings: ProfileSettings;
  musicTitleSupported?: boolean;
}) {
  const router = useRouter();
  const [musicUseAccent, setMusicUseAccent] = useState(!settings.music_player_color?.trim());
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadMusicAction, initial);
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  useSettingsRefresh(state);
  useSettingsRefresh(uploadState);

  useEffect(() => {
    setMusicUseAccent(!settings.music_player_color?.trim());
  }, [settings.updated_at, settings.music_player_color]);

  const handleRemove = async () => {
    await removeMusicAction();
    router.refresh();
  };

  return (
    <>
      <PageHeader title="Music" description="Upload profile music and configure playback." />

      <div className="space-y-6">
        <div className={cardClassName}>
          <form action={uploadAction} className="space-y-4">
            <label htmlFor="music" className={labelClassName}>Upload audio (max 20 MB)</label>
            <input
              id="music"
              name="music"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
              className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00e5cc] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
            />
            <FormFeedback error={uploadState.error} success={uploadState.success} />
            <button type="submit" disabled={uploadPending} className={buttonSecondaryClassName}>
              {uploadPending ? "Uploading..." : "Upload music"}
            </button>
          </form>

          {settings.music_url && (
            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
              <p className="text-xs text-neutral-500">Current track</p>
              <audio src={settings.music_url} controls className="w-full accent-[#00e5cc]" />
              <RemoveMediaButton
                label="Remove music"
                onClick={handleRemove}
              />
            </div>
          )}
        </div>

        <div className={cardClassName}>
          <form action={formAction} className="space-y-5">
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
