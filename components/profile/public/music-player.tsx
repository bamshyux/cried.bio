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
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="translate-x-px">
      <path d="M9 8.25v7.5l7.5-3.75L9 8.25z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
      <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <line x1="22" x2="16" y1="9" y2="15" />
        <line x1="16" x2="22" y1="9" y2="15" />
      </svg>
    );
  }

  if (level <= 33) {
    return (
      <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <path d="M15 9a4.984 4.984 0 0 0 0 6" />
      </svg>
    );
  }

  if (level <= 66) {
    return (
      <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <path d="M16 9a5 5 0 0 1 0 6" />
      </svg>
    );
  }

  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const savedVolumeRef = useRef(settings.music_volume > 0 ? settings.music_volume : 50);
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
    borderColor: `rgba(${accentRgb}, 0.22)`,
    boxShadow: `0 16px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(${accentRgb}, 0.12), 0 0 32px rgba(${accentRgb}, 0.14)`,
  } as CSSProperties;

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
      className="bf-music-player fixed bottom-5 right-5 z-50 w-[min(272px,calc(100vw-2rem))] rounded-2xl border bg-[#0a0a0a]/90 p-3 backdrop-blur-md"
      style={playerStyle}
    >
      <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="bf-music-player__play flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-[1.03] active:scale-[0.97]"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="bf-music-player__title truncate text-[13px] font-semibold leading-tight">{title}</p>
          <p className="bf-music-player__meta mt-0.5 truncate text-[11px] leading-tight">
            {playing ? "Playing" : "Paused"} · {timeLabel}
          </p>
        </div>
      </div>

      <div className="bf-music-track relative mt-3 h-1 rounded-full">
        <div className="bf-music-track__fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%` }} />
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={seek}
          className="bf-music-track__input absolute inset-x-0 -top-2 bottom-[-8px] w-full cursor-pointer opacity-0"
          aria-label="Seek"
          disabled={duration <= 0}
        />
      </div>

      <div className="bf-music-player__vol mt-2.5 flex h-8 items-center gap-2 rounded-full px-2">
        <button
          type="button"
          onClick={toggleMute}
          className="bf-music-player__vol-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
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
          className="bf-music-track__range min-w-0 flex-1"
          aria-label="Volume"
          style={{ "--bf-music-fill": `${volume}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}
