"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  HiMiniBackward,
  HiMiniForward,
  HiMiniPause,
  HiMiniPlay,
  HiMiniSpeakerWave,
  HiMiniSpeakerXMark,
} from "react-icons/hi2";
import { rgbString } from "@/lib/badges/badge-visuals";
import { resolveMusicPlayerColor } from "@/lib/settings";
import { rangeClassName, rangeFillStyle } from "@/lib/ui/range";
import { sortMusicTracks, type MusicTrack } from "@/lib/music/tracks";
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

function pickAdjacentIndex(
  current: number,
  length: number,
  direction: 1 | -1,
  shuffle: boolean,
): number {
  if (length <= 1) return 0;
  if (!shuffle) return (current + direction + length) % length;

  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
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
  const loadedUrlRef = useRef<string | null>(null);
  const suppressEndedRef = useRef(false);
  const trackIndexRef = useRef(0);
  const playlistRef = useRef<MusicTrack[]>([]);
  const playlistModeRef = useRef(false);
  const autoplayNextRef = useRef(false);
  const shuffleRef = useRef(false);
  const musicLoopRef = useRef(settings.music_loop);

  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(100, settings.music_volume)));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playlist = useMemo(() => {
    if (tracks.length > 0) return sortMusicTracks(tracks);
    if (settings.music_url) {
      return [
        {
          id: "single",
          url: settings.music_url,
          title: settings.music_title,
          sort_order: 0,
        } as MusicTrack,
      ];
    }
    return [];
  }, [tracks, settings.music_title, settings.music_url]);

  const [trackIndex, setTrackIndex] = useState(0);

  const playlistMode = Boolean(settings.music_playlist_mode && playlist.length > 1);
  const shuffle = settings.music_shuffle;
  const autoplayNext = settings.music_autoplay_next;
  const showSkipControls = playlist.length > 1;

  const currentTrack = playlist[trackIndex] ?? playlist[0];
  const currentUrl = currentTrack?.url ?? settings.music_url;

  trackIndexRef.current = trackIndex;
  playlistRef.current = playlist;
  playlistModeRef.current = playlistMode;
  autoplayNextRef.current = autoplayNext;
  shuffleRef.current = shuffle;
  musicLoopRef.current = settings.music_loop;

  const title = currentTrack?.title?.trim() ? currentTrack.title.trim() : formatTitle(settings);
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

  const loadTrack = useCallback(
    (url: string, autoplay: boolean) => {
      const audio = audioRef.current;
      if (!audio || !url) return;

      const loopSingleTrack = !playlistModeRef.current && musicLoopRef.current;
      audio.loop = loopSingleTrack;
      audio.volume = volumeRef.current / 100;

      if (loadedUrlRef.current === url) {
        if (autoplay && audio.paused) {
          void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        }
        return;
      }

      suppressEndedRef.current = true;
      loadedUrlRef.current = url;
      audio.src = url;
      setCurrentTime(0);
      setDuration(0);

      const beginPlayback = () => {
        suppressEndedRef.current = false;
        if (!autoplay) {
          audio.pause();
          setPlaying(false);
          return;
        }
        void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      };

      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        beginPlayback();
        return;
      }

      audio.addEventListener("canplay", beginPlayback, { once: true });
      audio.load();
    },
    [],
  );

  const goToTrack = useCallback(
    (nextIndex: number, autoplay = true) => {
      if (nextIndex < 0 || nextIndex >= playlistRef.current.length) return;
      setTrackIndex(nextIndex);
      const nextUrl = playlistRef.current[nextIndex]?.url;
      if (nextUrl) loadTrack(nextUrl, autoplay);
    },
    [loadTrack],
  );

  const goToNextTrack = useCallback(
    (autoplay = true) => {
      const nextIndex = pickAdjacentIndex(
        trackIndexRef.current,
        playlistRef.current.length,
        1,
        shuffleRef.current,
      );
      goToTrack(nextIndex, autoplay);
    },
    [goToTrack],
  );

  const goToPreviousTrack = useCallback(
    (autoplay = true) => {
      const nextIndex = pickAdjacentIndex(
        trackIndexRef.current,
        playlistRef.current.length,
        -1,
        shuffleRef.current,
      );
      goToTrack(nextIndex, autoplay);
    },
    [goToTrack],
  );

  const playFromStart = useCallback(() => {
    const url = playlistRef.current[trackIndexRef.current]?.url ?? currentUrl;
    if (!url) return;
    loadedUrlRef.current = null;
    loadTrack(url, true);
  }, [currentUrl, loadTrack]);

  useEffect(() => {
    onPlayReady?.(playFromStart);
  }, [onPlayReady, playFromStart]);

  useEffect(() => {
    setTrackIndex((index) => Math.min(index, Math.max(playlist.length - 1, 0)));
  }, [playlist.length]);

  useEffect(() => {
    if (!currentUrl || deferAutoplay) return;
    if (loadedUrlRef.current === currentUrl) return;
    loadTrack(currentUrl, settings.music_autoplay);
  }, [currentUrl, deferAutoplay, loadTrack, settings.music_autoplay]);

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
      if (suppressEndedRef.current) return;

      const list = playlistRef.current;
      const mode = playlistModeRef.current;
      const shouldAutoplayNext = autoplayNextRef.current;
      const shouldShuffle = shuffleRef.current;
      const loop = musicLoopRef.current;

      if (mode && list.length > 1) {
        if (shouldAutoplayNext || loop) {
          const nextIndex = pickAdjacentIndex(trackIndexRef.current, list.length, 1, shouldShuffle);
          goToTrack(nextIndex, true);
          return;
        }
      }

      if (!loop) setPlaying(false);
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
  }, [goToTrack]);

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
      <audio ref={audioRef} preload="metadata" playsInline />

      <div
        className="bf-audio__panel"
        onClick={() => {
          if (!open) reveal();
        }}
      >
        <div className="bf-audio__head">
          <div className="bf-audio__transport">
            {showSkipControls ? (
              <button
                type="button"
                className="bf-audio__skip"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPreviousTrack(true);
                }}
                aria-label="Previous track"
              >
                <HiMiniBackward size={16} />
              </button>
            ) : null}

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

            {showSkipControls ? (
              <button
                type="button"
                className="bf-audio__skip"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNextTrack(true);
                }}
                aria-label="Next track"
              >
                <HiMiniForward size={16} />
              </button>
            ) : null}
          </div>

          <div className="bf-audio__info">
            <p className="bf-audio__status">
              <span className="bf-audio__dot" aria-hidden />
              {playing ? "NOW PLAYING" : "PAUSED"}
              {showSkipControls ? (
                <span className="bf-audio__track-count">
                  {trackIndex + 1}/{playlist.length}
                </span>
              ) : null}
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
