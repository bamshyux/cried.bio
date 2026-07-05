"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { rgbString } from "@/lib/badges/badge-visuals";
import { resolveMusicPlayerColor } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

function contrastOnAccent(hex: string): string {
  const rgb = hex.replace("#", "").trim();
  if (rgb.length !== 6) return "#000000";
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return "#000000";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#000000" : "#ffffff";
}

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

const iconStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PlayIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="translate-x-px">
      <path d="M9 8.25v7.5l7.5-3.75L9 8.25z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="7.75" y="6.75" width="3.25" height="10.5" rx="0.75" />
      <rect x="12.75" y="6.75" width="3.25" height="10.5" rx="0.75" />
    </svg>
  );
}

function VolumeIcon({ level }: { level: number }) {
  const speaker = (
    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
  );

  if (level <= 0) {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <line x1="22" x2="16" y1="9" y2="15" />
        <line x1="16" x2="22" y1="9" y2="15" />
      </svg>
    );
  }

  if (level <= 33) {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <path d="M15 9a4.984 4.984 0 0 0 0 6" />
      </svg>
    );
  }

  if (level <= 66) {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <path d="M16 9a5 5 0 0 1 0 6" />
      </svg>
    );
  }

  return (
    <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
      {speaker}
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.364 6.636a9 9 0 0 1 0 12.728" />
    </svg>
  );
}

type MusicPlayerProps = {
  settings: ProfileSettings;
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const savedVolumeRef = useRef(settings.music_volume > 0 ? settings.music_volume : 50);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(100, settings.music_volume)));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const title = formatTitle(settings);
  const accent = resolveMusicPlayerColor(settings);
  const accentRgb = rgbString(accent);
  const onAccent = contrastOnAccent(accent);
  const textColor = settings.text_color?.trim() || "#fafafa";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isMuted = volume === 0;

  const playerStyle = {
    "--bf-music-accent": accent,
    "--bf-music-accent-rgb": accentRgb,
    "--bf-music-on-accent": onAccent,
    "--bf-music-text": textColor,
  } as CSSProperties;

  const openPanel = useCallback(() => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setExpanded(true);
  }, []);

  const closePanel = useCallback(() => {
    if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => setExpanded(false), 180);
  }, []);

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

    const onPointerDown = (event: PointerEvent) => {
      if (shellRef.current?.contains(event.target as Node)) return;
      setExpanded(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    };
  }, []);

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

  const toggleMute = () => {
    if (volume > 0) setVolumeLevel(0);
    else setVolumeLevel(savedVolumeRef.current || 50);
  };

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const next = (Number(event.target.value) / 100) * audio.duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const timeLabel =
    duration > 0
      ? `${formatTime(currentTime)} / ${formatTime(duration)}`
      : formatTime(currentTime);

  return (
    <div
      ref={shellRef}
      className="bf-music-player fixed bottom-5 right-5 z-50"
      style={playerStyle}
      data-expanded={expanded ? "true" : "false"}
      data-playing={playing ? "true" : "false"}
      onMouseEnter={openPanel}
      onMouseLeave={closePanel}
      onFocusCapture={openPanel}
      onBlurCapture={(event) => {
        if (shellRef.current?.contains(event.relatedTarget as Node)) return;
        closePanel();
      }}
    >
      <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

      <div
        className="bf-music-player__shell"
        onClick={() => {
          if (!expanded) openPanel();
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          className="bf-music-player__play"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {expanded ? (
          <div className="bf-music-player__panel" onClick={(event) => event.stopPropagation()}>
            <div className="bf-music-player__head">
              <p className="bf-music-player__title">{title}</p>
              <p className="bf-music-player__meta">
                {playing ? "Playing" : "Paused"} · {timeLabel}
              </p>
            </div>

            <div className="bf-music-track">
              <div className="bf-music-track__fill" style={{ width: `${progress}%` }} />
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={seek}
                className="bf-music-track__input"
                aria-label="Seek"
                disabled={duration <= 0}
              />
            </div>

            <div className="bf-music-player__vol">
              <button
                type="button"
                onClick={toggleMute}
                className="bf-music-player__vol-btn"
                aria-label={isMuted ? "Unmute" : "Mute"}
                aria-pressed={isMuted}
              >
                <VolumeIcon level={isMuted ? 0 : volume} />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => setVolumeLevel(Number(event.target.value))}
                className="bf-music-track__range"
                aria-label="Volume"
                style={{ "--bf-music-fill": `${volume}%` } as CSSProperties}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
