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

export function MusicPlayer({ settings }: { settings: ProfileSettings }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayEnabledRef = useRef(settings.music_autoplay);
  const volumeRef = useRef(settings.music_volume);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(settings.music_volume);
  const [expanded, setExpanded] = useState(false);
  const title = formatTitle(settings);
  const playerColor = resolveMusicPlayerColor(settings);

  autoplayEnabledRef.current = settings.music_autoplay;
  volumeRef.current = volume;

  const applyVolume = useCallback((value = volumeRef.current) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value / 100;
  }, []);

  const resetToStart = useCallback((audio: HTMLAudioElement) => {
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore seek errors before metadata loads */
    }
  }, []);

  const pauseAtStart = useCallback(
    (audio: HTMLAudioElement) => {
      resetToStart(audio);
      audio.pause();
      setPlaying(false);
    },
    [resetToStart],
  );

  const tryAutoplay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !settings.music_url || !settings.music_autoplay) return false;

    resetToStart(audio);
    audio.loop = settings.music_loop;
    applyVolume();

    const playUnmuted = async () => {
      audio.muted = false;
      applyVolume();
      await audio.play();
    };

    try {
      await playUnmuted();
      setPlaying(true);
      return true;
    } catch {
      try {
        audio.muted = true;
        await audio.play();
        audio.muted = false;
        applyVolume();
        setPlaying(true);
        return true;
      } catch {
        setPlaying(false);
        return false;
      }
    }
  }, [applyVolume, resetToStart, settings.music_autoplay, settings.music_loop, settings.music_url]);

  useEffect(() => {
    applyVolume(volume);
  }, [applyVolume, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !settings.music_url) return;

    audio.loop = settings.music_loop;

    if (!settings.music_autoplay) {
      pauseAtStart(audio);
      return;
    }

    let cancelled = false;
    let started = false;
    let gestureCleanup: (() => void) | null = null;

    const scheduleAutoplay = () => {
      if (cancelled || started) return;
      void tryAutoplay().then((didStart) => {
        if (didStart) started = true;
        if (cancelled || didStart || !autoplayEnabledRef.current) return;

        const retryOnGesture = () => {
          if (!autoplayEnabledRef.current) return;
          void tryAutoplay().then((ok) => {
            if (ok) started = true;
          });
        };

        window.addEventListener("pointerdown", retryOnGesture, { once: true, capture: true });
        window.addEventListener("keydown", retryOnGesture, { once: true, capture: true });
        gestureCleanup = () => {
          window.removeEventListener("pointerdown", retryOnGesture, true);
          window.removeEventListener("keydown", retryOnGesture, true);
        };
      });
    };

    resetToStart(audio);
    audio.addEventListener("canplay", scheduleAutoplay, { once: true });

    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleAutoplay();
    } else {
      audio.load();
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (!autoplayEnabledRef.current) return;
      if (event.persisted) {
        started = false;
        scheduleAutoplay();
      }
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      audio.removeEventListener("canplay", scheduleAutoplay);
      window.removeEventListener("pageshow", onPageShow);
      gestureCleanup?.();
    };
  }, [
    pauseAtStart,
    resetToStart,
    settings.music_autoplay,
    settings.music_loop,
    settings.music_url,
    tryAutoplay,
  ]);

  if (!settings.music_url) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    void audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
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
        <audio
          key={settings.music_url}
          ref={audioRef}
          src={settings.music_url}
          preload={settings.music_autoplay ? "auto" : "metadata"}
          playsInline
        />

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
                  applyVolume(v);
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
