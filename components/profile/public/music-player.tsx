"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  HiMiniPause,
  HiMiniPlay,
  HiMiniSpeakerWave,
  HiMiniSpeakerXMark,
} from "react-icons/hi2";
import { rgbString } from "@/lib/badges/badge-visuals";
import { resolveMusicPlayerColor } from "@/lib/settings";
import { rangeClassName, rangeFillStyle } from "@/lib/ui/range";
import type { MusicTrack } from "@/lib/data/music-tracks";
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

function contrastOnAccent(hex: string): string {
  const rgb = hex.replace("#", "").trim();
  if (rgb.length !== 6) return "#ffffff";
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0a0a0a" : "#ffffff";
}

type MusicPlayerProps = {
  settings: ProfileSettings;
  tracks?: MusicTrack[];
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, tracks = [], deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const savedVolumeRef = useRef(settings.music_volume > 0 ? settings.music_volume : 50);
  const volumeRef = useRef(Math.max(0, Math.min(100, settings.music_volume)));
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(100, settings.music_volume)));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [trackIndex, setTrackIndex] = useState(0);

  const playlist = tracks.length > 0
    ? tracks
    : settings.music_url
      ? [{ id: "single", url: settings.music_url, title: settings.music_title, sort_order: 0 } as MusicTrack]
      : [];

  const playlistMode = Boolean(
    (settings as ProfileSettings & { music_playlist_mode?: boolean }).music_playlist_mode &&
      playlist.length > 1,
  );
  const shuffle = Boolean((settings as ProfileSettings & { music_shuffle?: boolean }).music_shuffle);
  const autoplayNext = Boolean(
    (settings as ProfileSettings & { music_autoplay_next?: boolean }).music_autoplay_next,
  );

  const currentTrack = playlist[trackIndex] ?? playlist[0];
  const currentUrl = currentTrack?.url ?? settings.music_url;

  const title = currentTrack?.title?.trim()
    ? currentTrack.title.trim()
    : formatTitle(settings);
  const accent = resolveMusicPlayerColor(settings);
  const accentRgb = rgbString(accent);
  const textColor = settings.text_color?.trim() || "#fafafa";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isMuted = volume === 0;

  const style = {
    "--bf-audio-accent": accent,
    "--bf-audio-accent-rgb": accentRgb,
    "--bf-audio-text": textColor,
    "--bf-audio-on-accent": contrastOnAccent(accent),
    "--bf-range-accent": accent,
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
    leaveTimerRef.current = window.setTimeout(() => setOpen(false), 200);
  }, []);

  const setVolumeLevel = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    if (clamped > 0) savedVolumeRef.current = clamped;
    volumeRef.current = clamped;
    setVolume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped / 100;
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const playFromStart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    audio.src = currentUrl;
    audio.loop = playlistMode ? false : settings.music_loop;
    audio.volume = volumeRef.current / 100;
    audio.currentTime = 0;
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [currentUrl, playlistMode, settings.music_loop]);

  useEffect(() => {
    onPlayReady?.(playFromStart);
  }, [onPlayReady, playFromStart, currentUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl || deferAutoplay) return;

    audio.src = currentUrl;
    audio.loop = playlistMode ? false : settings.music_loop;
    audio.volume = volumeRef.current / 100;

    const startPlayback = () => {
      if (!settings.music_autoplay) {
        audio.pause();
        setPlaying(false);
        return;
      }
      if (!audio.paused) return;
      audio.currentTime = 0;
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      startPlayback();
      return;
    }

    audio.addEventListener("canplay", startPlayback, { once: true });
    return () => audio.removeEventListener("canplay", startPlayback);
  }, [currentUrl, deferAutoplay, playlistMode, settings.music_autoplay, settings.music_loop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playNext = () => {
      if (!playlistMode || playlist.length <= 1) return;
      setTrackIndex((prev) => {
        if (shuffle) return Math.floor(Math.random() * playlist.length);
        return (prev + 1) % playlist.length;
      });
    };

    const syncDuration = () => {
      const next = audio.duration;
      setDuration(Number.isFinite(next) && next > 0 ? next : 0);
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      if (playlistMode && autoplayNext) {
        playNext();
        return;
      }
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
  }, [autoplayNext, playlist.length, playlistMode, settings.music_loop, shuffle, currentUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    audio.src = currentUrl;
    audio.load();
    if (playing) void audio.play().catch(() => setPlaying(false));
  }, [currentUrl]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
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

  if (!currentUrl) return null;

  const showPlayer = settings.music_show_player !== false;

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

  if (!showPlayer) {
    return (
      <audio ref={audioRef} src={currentUrl} preload="metadata" playsInline className="sr-only" aria-hidden />
    );
  }

  return (
    <div
      ref={rootRef}
      className="bf-audio"
      style={style}
      data-open={open ? "true" : "false"}
      data-playing={playing ? "true" : "false"}
      onMouseEnter={reveal}
      onMouseLeave={hide}
      onFocusCapture={reveal}
      onBlurCapture={(event) => {
        if (rootRef.current?.contains(event.relatedTarget as Node)) return;
        hide();
      }}
    >
      <audio ref={audioRef} src={currentUrl} preload="metadata" playsInline />

      <div
        className="bf-audio__panel"
        onClick={() => {
          if (!open) reveal();
        }}
      >
        <div className="bf-audio__head">
          <button
            type="button"
            className="bf-audio__play"
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <HiMiniPause size={18} /> : <HiMiniPlay size={18} />}
          </button>

          <div className="bf-audio__info">
            <p className="bf-audio__status">
              <span className="bf-audio__dot" aria-hidden />
              {playing ? "NOW PLAYING" : "PAUSED"}
            </p>
            <p className="bf-audio__title">{title}</p>
          </div>
        </div>

        <div className="bf-audio__controls" onClick={(event) => event.stopPropagation()}>
          <div className="bf-audio__controls-inner">
            <div className="bf-audio__seek">
              <span className="bf-audio__time">{formatTime(currentTime)}</span>
              <div className="bf-audio__bar">
                <div className="bf-audio__bar-fill" style={{ width: `${progress}%` }} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progress}
                  onChange={seek}
                  className="bf-audio__bar-input"
                  aria-label="Seek"
                  disabled={duration <= 0}
                />
              </div>
              <span className="bf-audio__time">{formatTime(duration)}</span>
            </div>

            <div className="bf-audio__vol">
            <button
              type="button"
              className="bf-audio__vol-btn"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={isMuted}
            >
              {isMuted ? <HiMiniSpeakerXMark size={16} /> : <HiMiniSpeakerWave size={16} />}
            </button>
            <div className="bf-range-wrap bf-audio__vol-range">
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => setVolumeLevel(Number(event.target.value))}
                className={rangeClassName}
                aria-label="Volume"
                style={rangeFillStyle(volume, 0, 100, accent)}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
