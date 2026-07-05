"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { resolveMusicPlayerColor } from "@/lib/settings";
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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <line x1="16" y1="9" x2="20" y2="13" />
        <line x1="20" y1="9" x2="16" y2="13" />
      </svg>
    );
  }

  if (volume < 40) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 12a3.5 3.5 0 0 0 0-7" />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 12a3.5 3.5 0 0 0 0-7" />
      <path d="M18.5 8.5a7 7 0 0 1 0 7" />
    </svg>
  );
}

type MusicPlayerProps = {
  settings: ProfileSettings;
  /** Hold autoplay until the parent triggers play (e.g. enter gate click) */
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const savedVolumeRef = useRef(
    settings.music_volume > 0 ? settings.music_volume : 50,
  );
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() =>
    Math.max(0, Math.min(100, settings.music_volume)),
  );
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const title = formatTitle(settings);
  const playerColor = resolveMusicPlayerColor(settings);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isMuted = volume === 0;

  const setVolumeLevel = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    if (clamped > 0) savedVolumeRef.current = clamped;
    setVolume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped / 100;
  }, []);

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
    if (!audio || !settings.music_url || deferAutoplay) return;

    audio.loop = settings.music_loop;
    audio.volume = volume / 100;

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
  }, [deferAutoplay, settings.music_autoplay, settings.music_loop, settings.music_url, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const next = audio.duration;
      setDuration(Number.isFinite(next) && next > 0 ? next : 0);
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      if (!settings.music_loop) setPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    syncDuration();

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [settings.music_loop, settings.music_url]);

  useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  useEffect(
    () => () => {
      if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    },
    [],
  );

  if (!settings.music_url) return null;

  const openPanel = () => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setExpanded(true);
  };

  const scheduleCollapse = () => {
    if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = window.setTimeout(() => setExpanded(false), 450);
  };

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

  const toggleMute = () => {
    if (volume > 0) {
      setVolumeLevel(0);
      return;
    }
    setVolumeLevel(savedVolumeRef.current || 50);
  };

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const next = (Number(event.target.value) / 100) * audio.duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <div
      className="bf-music-player fixed bottom-5 right-5 z-50"
      style={{ "--bf-music-accent": playerColor } as CSSProperties}
    >
      <div
        ref={shellRef}
        className={`bf-music-player__shell ${expanded ? "bf-music-player__shell--expanded" : ""} ${playing ? "bf-music-player__shell--playing" : ""}`}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleCollapse}
        onFocusCapture={openPanel}
        onBlurCapture={(event) => {
          if (!shellRef.current?.contains(event.relatedTarget as Node)) {
            scheduleCollapse();
          }
        }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, input")) return;
          openPanel();
        }}
      >
        <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

        <button
          type="button"
          onClick={toggle}
          className={`bf-music-player__toggle ${playing ? "bf-music-player__toggle--playing" : ""}`}
          aria-label={playing ? "Pause" : "Play"}
        >
          <span className="bf-music-player__toggle-ring" aria-hidden />
          <span className="bf-music-player__toggle-disc" aria-hidden />
          <span className="bf-music-player__toggle-icon">
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.2v13.6c0 .8.9 1.3 1.6.9l10.4-6.1a1 1 0 0 0 0-1.7L9.6 4.3A1 1 0 0 0 8 5.2z" />
              </svg>
            )}
          </span>
        </button>

        {expanded ? (
          <div className="bf-music-player__panel">
            <div className="bf-music-player__panel-body">
              <div className="bf-music-player__meta">
                <span className={`bf-music-player__status ${playing ? "bf-music-player__status--live" : ""}`}>
                  {playing ? "Now playing" : "Paused"}
                </span>
                <p className="bf-music-player__title">{title}</p>
              </div>

              <div className="bf-music-player__progress">
                <span className="bf-music-player__time">{formatTime(currentTime)}</span>
                <div className="bf-music-player__progress-track">
                  <div
                    className="bf-music-player__progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={progress}
                    onChange={seek}
                    className="bf-music-player__progress-input"
                    aria-label="Seek"
                    disabled={duration <= 0}
                  />
                </div>
                <span className="bf-music-player__time">
                  {duration > 0 ? formatTime(duration) : "--:--"}
                </span>
              </div>

              <div className="bf-music-player__volume">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`bf-music-player__volume-btn ${isMuted ? "bf-music-player__volume-btn--muted" : ""}`}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  aria-pressed={isMuted}
                >
                  <VolumeIcon volume={volume} />
                </button>
                <div className="bf-music-player__volume-track">
                  <div
                    className="bf-music-player__volume-fill"
                    style={{ width: `${volume}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(event) => setVolumeLevel(Number(event.target.value))}
                    className="bf-music-player__volume-input"
                    aria-label="Volume"
                    aria-valuenow={volume}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
