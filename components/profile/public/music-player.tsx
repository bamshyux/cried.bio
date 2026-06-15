"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveMusicPlayerColor } from "@/lib/settings";
import { rangeClassName, rangeFillStyle } from "@/lib/ui/range";
import type { ProfileSettings } from "@/lib/types/settings";

function formatTitle(settings: ProfileSettings) {
  if (settings.music_title?.trim()) return settings.music_title.trim();
  if (settings.music_url) {
    try {
      const name = settings.music_url.split("/").pop()?.split(".")[0];
      if (name) return decodeURIComponent(name).replace(/[-_]/g, " ");
    } catch {
      /* ignore */
    }
  }
  return "Profile Track";
}

type MusicPlayerProps = {
  settings: ProfileSettings;
  /** Hold autoplay until the parent triggers play (e.g. enter gate click) */
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(settings.music_volume);
  const [expanded, setExpanded] = useState(false);
  const title = formatTitle(settings);
  const playerColor = resolveMusicPlayerColor(settings);

  const playFromStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !settings.music_url) return;

    audio.loop = settings.music_loop;
    audio.volume = volume / 100;
    audio.currentTime = 0;

    void audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [settings.music_loop, settings.music_url, volume]);

  useEffect(() => {
    onPlayReady?.(playFromStart);
  }, [onPlayReady, playFromStart]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !settings.music_url || deferAutoplay) return;

    audio.loop = settings.music_loop;
    audio.volume = settings.music_volume / 100;

    const startPlayback = () => {
      if (!settings.music_autoplay) {
        audio.pause();
        setPlaying(false);
        return;
      }

      if (!audio.paused) return;

      audio.currentTime = 0;
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      startPlayback();
      return;
    }

    audio.addEventListener("canplay", startPlayback, { once: true });
    return () => audio.removeEventListener("canplay", startPlayback);
  }, [deferAutoplay, settings.music_autoplay, settings.music_loop, settings.music_url, settings.music_volume]);

  if (!settings.music_url) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`flex items-center rounded-full border border-white/[0.08] bg-[#0a0a0a]/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ease-out ${
          expanded ? "gap-3 px-3 py-2" : "p-1"
        }`}
        style={{
          boxShadow: expanded
            ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${playerColor}20`
            : `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px ${playerColor}12`,
        }}
      >
        <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

        <button
          type="button"
          onClick={toggle}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
          style={{
            backgroundColor: `${playerColor}20`,
            color: playerColor,
            boxShadow: playing ? `0 0 24px ${playerColor}35` : undefined,
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>

        {expanded && (
          <>
            <div className="min-w-0 max-w-[160px]">
              <p className="truncate text-xs font-medium text-white">{title}</p>
              <p className="text-[10px] text-neutral-500">{playing ? "Now playing" : "Paused"}</p>
            </div>

            <div className="bf-range-wrap flex items-center pr-1">
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v / 100;
                }}
                className={`${rangeClassName} !w-16`}
                style={rangeFillStyle(volume, 0, 100, playerColor)}
                aria-label="Volume"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
