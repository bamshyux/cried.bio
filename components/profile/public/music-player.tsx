"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { rgbString } from "@/lib/badges/badge-visuals";
import { resolveMusicPlayerColor } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

const RING_R = 19;
const RING_C = 2 * Math.PI * RING_R;

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

function PlayGlyph() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="translate-x-px">
      <path d="M8 6.5v11l9.5-5.5L8 6.5z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="7" y="6" width="3.5" height="12" rx="0.75" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="0.75" />
    </svg>
  );
}

function VolumeGlyph({ level }: { level: number }) {
  const speaker = (
    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
  );

  if (level <= 0) {
    return (
      <svg width={13} height={13} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
        {speaker}
        <line x1="22" x2="16" y1="9" y2="15" />
        <line x1="16" x2="22" y1="9" y2="15" />
      </svg>
    );
  }

  return (
    <svg width={13} height={13} viewBox="0 0 24 24" aria-hidden {...iconStroke}>
      {speaker}
      <path d="M16 9a5 5 0 0 1 0 6" />
      {level > 50 ? <path d="M19.364 6.636a9 9 0 0 1 0 12.728" /> : null}
    </svg>
  );
}

type MusicPlayerProps = {
  settings: ProfileSettings;
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const savedVolumeRef = useRef(settings.music_volume > 0 ? settings.music_volume : 50);
  const [open, setOpen] = useState(false);
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
  const ringOffset = RING_C - (progress / 100) * RING_C;
  const isMuted = volume === 0;

  const dockStyle = {
    "--bf-music-accent": accent,
    "--bf-music-accent-rgb": accentRgb,
    "--bf-music-on-accent": onAccent,
    "--bf-music-text": textColor,
  } as CSSProperties;

  const reveal = useCallback(() => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => setOpen(false), 220);
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
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (dockRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

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

  return (
    <div
      ref={dockRef}
      className="bf-music-dock"
      style={dockStyle}
      data-open={open ? "true" : "false"}
      data-playing={playing ? "true" : "false"}
      onMouseEnter={reveal}
      onMouseLeave={hide}
      onFocusCapture={reveal}
      onBlurCapture={(event) => {
        if (dockRef.current?.contains(event.relatedTarget as Node)) return;
        hide();
      }}
    >
      <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

      <div className="bf-music-dock__sheet" aria-hidden={!open}>
        <div className="bf-music-dock__sheet-inner">
          <div className="bf-music-dock__marquee-wrap">
            <p className="bf-music-dock__marquee">
              <span>{title}</span>
              <span aria-hidden>{title}</span>
            </p>
          </div>

          <div className="bf-music-dock__row">
            <span className="bf-music-dock__time">{formatTime(currentTime)}</span>
            <div className="bf-music-dock__track">
              <div className="bf-music-dock__track-fill" style={{ width: `${progress}%` }} />
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={seek}
                className="bf-music-dock__track-input"
                aria-label="Seek"
                disabled={duration <= 0}
              />
            </div>
            <span className="bf-music-dock__time">{formatTime(duration)}</span>
          </div>

          <div className="bf-music-dock__row bf-music-dock__row--vol">
            <button
              type="button"
              onClick={toggleMute}
              className="bf-music-dock__vol"
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={isMuted}
            >
              <VolumeGlyph level={isMuted ? 0 : volume} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(event) => setVolumeLevel(Number(event.target.value))}
              className="bf-music-dock__vol-slider"
              aria-label="Volume"
              style={{ "--bf-music-fill": `${volume}%` } as CSSProperties}
            />
          </div>
        </div>
      </div>

      <div
        className="bf-music-dock__orb"
        onClick={() => {
          if (!open) reveal();
        }}
      >
        <div className="bf-music-dock__eq" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="bf-music-dock__eq-bar" style={{ "--bf-eq-i": i } as CSSProperties} />
          ))}
        </div>

        <svg className="bf-music-dock__ring" viewBox="0 0 48 48" aria-hidden>
          <circle
            className="bf-music-dock__ring-bg"
            cx={24}
            cy={24}
            r={RING_R}
            fill="none"
            strokeWidth={2.5}
          />
          <circle
            className="bf-music-dock__ring-progress"
            cx={24}
            cy={24}
            r={RING_R}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={ringOffset}
            transform="rotate(-90 24 24)"
          />
        </svg>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          className="bf-music-dock__toggle"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </button>
      </div>
    </div>
  );
}
