"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Music2,
  Pause,
  Play,
  Volume2,
  X
} from "lucide-react";
import type { ParsedMedia } from "@/lib/types";
import { ProviderBadge } from "./ProviderBadge";
import styles from "./FloatingNowPlaying.module.css";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function FloatingNowPlaying({
  media,
  onClose
}: {
  media: ParsedMedia | null;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [minimized, setMinimized] = useState(false);

  const audioUrl = media?.audioUrl;

  useEffect(() => {
    setMinimized(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);

    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.currentTime = 0;
    audio.volume = volume;

    const promise = audio.play();
    if (promise) {
      promise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [audioUrl, media?.embedUrl]);

  if (!media) return null;

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  }

  const classes = `${styles.window} ${minimized ? styles.minimized : ""}`;

  if (media.audioUrl) {
    return (
      <aside className={classes} aria-label="Сейчас играет">
        <audio
          ref={audioRef}
          key={media.audioUrl}
          src={media.audioUrl}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.kicker}>Сейчас играет</span>
            <strong>{media.label}</strong>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? "Развернуть плеер" : "Свернуть плеер"}
            >
              {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Закрыть плеер">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.trackInfo}>
            {media.cover ? (
              <img className={styles.cover} src={media.cover} alt="" />
            ) : (
              <div className={`${styles.cover} ${styles.coverPlaceholder}`}><Music2 size={24} /></div>
            )}
            <div className={styles.meta}>
              <ProviderBadge provider={media.provider} />
              <h3>{media.label}</h3>
              <p>{media.subtitle || "Silencia"}</p>
            </div>
          </div>

          <div className={styles.progressRow}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={Math.min(currentTime, duration || 30)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Позиция трека"
            />
            <span className={styles.time}>{formatTime(duration)}</span>
          </div>

          <div className={styles.controls}>
            <div className={styles.leftControls}>
              <button className={styles.playButton} type="button" onClick={togglePlayback} aria-label={playing ? "Пауза" : "Воспроизвести"}>
                {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
              </button>
              <a className={styles.sourceButton} href={media.sourceUrl} target="_blank" rel="noreferrer" title="Открыть источник">
                <ExternalLink size={16} />
              </a>
            </div>
            <div className={styles.volume}>
              <Volume2 size={16} />
              <input
                className={styles.range}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => changeVolume(Number(event.target.value))}
                aria-label="Громкость"
              />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (media.playableInline && media.embedUrl) {
    const height = media.provider === "youtube" ? 205 : media.provider === "soundcloud" ? 166 : 152;

    return (
      <aside className={classes} aria-label="Сейчас играет">
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.kicker}>Сейчас играет</span>
            <strong>{media.label}</strong>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? "Развернуть плеер" : "Свернуть плеер"}
            >
              {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <a className={styles.iconButton} href={media.sourceUrl} target="_blank" rel="noreferrer" aria-label="Открыть источник">
              <ExternalLink size={15} />
            </a>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Закрыть плеер">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className={styles.embedBody}>
          <iframe
            key={media.embedUrl}
            className={styles.embed}
            src={media.embedUrl}
            title={`${media.label} player`}
            height={height}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className={classes} aria-label="Сейчас играет">
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Сейчас играет</span>
          <strong>{media.label}</strong>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
      </header>
      <div className={styles.fallback}>
        Этот источник нельзя встроить в Silencia. <a href={media.sourceUrl} target="_blank" rel="noreferrer">Открыть трек</a>.
      </div>
    </aside>
  );
}
