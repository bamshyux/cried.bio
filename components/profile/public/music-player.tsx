"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  HiMiniPause,
  HiMiniPlay,
  HiMiniSpeakerWave,
  HiMiniSpeakerXMark,
} from "react-icons/hi2";
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

type MusicPlayerProps = {
  settings: ProfileSettings;
  deferAutoplay?: boolean;
  onPlayReady?: (play: () => void) => void;
};

export function MusicPlayer({ settings, deferAutoplay = false, onPlayReady }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const savedVolumeRef = useRef(settings.music_volume > 0 ? settings.music_volume : 50);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(100, settings.music_volume)));
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
    collapseTimerRef.current = window.setTimeout(() => setExpanded(false), 500);
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
        className={`bf-music-player__shell ${expanded ? "bf-music-player__shell--expanded" : ""}`}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleCollapse}
        onFocusCapture={openPanel}
        onBlurCapture={(event) => {
          if (!shellRef.current?.contains(event.relatedTarget as Node)) {
            scheduleCollapse();
          }
        }}
      >
        <audio ref={audioRef} src={settings.music_url} preload="metadata" playsInline />

        <div className="bf-music-player__head">
          <button
            type="button"
            onClick={toggle}
            className={`bf-music-player__play ${playing ? "bf-music-player__play--active" : ""}`}
            aria-label={playing ? "Pause" : "Play"}
          >
            <span className="bf-music-player__play-icon">
              {playing ? <HiMiniPause aria-hidden /> : <HiMiniPlay aria-hidden />}
            </span>
          </button>

          {expanded ? (
            <div className="bf-music-player__info">
              <p className="bf-music-player__title">{title}</p>
              <p className="bf-music-player__subtitle">
                {playing ? "Now playing" : "Paused"}
                {duration > 0 ? ` · ${formatTime(currentTime)} / ${formatTime(duration)}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        {expanded ? (
          <div className="bf-music-player__controls">
            <div className="bf-music-player__progress">
              <div className="bf-music-player__progress-track">
                <div className="bf-music-player__progress-fill" style={{ width: `${progress}%` }} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progress}
                  onChange={seek}
                  className="bf-music-player__scrub"
                  aria-label="Seek"
                  disabled={duration <= 0}
                />
              </div>
            </div>

            <div className="bf-music-player__volume-row">
              <button
                type="button"
                onClick={toggleMute}
                className={`bf-music-player__mute ${isMuted ? "bf-music-player__mute--off" : ""}`}
                aria-label={isMuted ? "Unmute" : "Mute"}
                aria-pressed={isMuted}
              >
                <span className="bf-music-player__mute-icon">
                  {isMuted ? <HiMiniSpeakerXMark aria-hidden /> : <HiMiniSpeakerWave aria-hidden />}
                </span>
                <span className="bf-music-player__mute-label">{isMuted ? "Unmute" : "Mute"}</span>
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => setVolumeLevel(Number(event.target.value))}
                className="bf-music-player__volume"
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
