"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Music2, Pause, Play, Volume2, X } from "lucide-react";
import type { ParsedMedia } from "@/lib/types";
import { ProviderBadge } from "./ProviderBadge";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function BottomAudioPlayer({
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

  const audioUrl = media?.audioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.currentTime = 0;
    audio.volume = volume;
    setCurrentTime(0);
    setDuration(0);

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [audioUrl]);

  if (!media?.audioUrl) return null;

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
    const audio = audioRef.current;
    setVolume(value);
    if (audio) audio.volume = value;
  }

  return (
    <div className="bottom-player" role="region" aria-label="Silencia mini player">
      <audio
        ref={audioRef}
        key={media.audioUrl}
        src={media.audioUrl}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="bottom-track">
        {media.cover ? (
          <img className="bottom-cover" src={media.cover} alt="" />
        ) : (
          <div className="bottom-cover bottom-cover-placeholder"><Music2 size={19} /></div>
        )}
        <div className="bottom-meta">
          <strong>{media.label}</strong>
          <span>{media.subtitle || "Silencia"}</span>
        </div>
        <ProviderBadge provider={media.provider} />
      </div>

      <div className="bottom-controls">
        <button className="bottom-play" type="button" onClick={togglePlayback} aria-label={playing ? "Пауза" : "Воспроизвести"}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <span className="bottom-time">{formatTime(currentTime)}</span>
        <input
          className="bottom-progress"
          type="range"
          min={0}
          max={duration || 30}
          step={0.1}
          value={Math.min(currentTime, duration || 30)}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Позиция трека"
        />
        <span className="bottom-time">{formatTime(duration)}</span>
      </div>

      <div className="bottom-actions">
        <Volume2 size={17} />
        <input
          className="bottom-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
          aria-label="Громкость"
        />
        <a href={media.sourceUrl} target="_blank" rel="noreferrer" className="bottom-icon" title="Открыть источник">
          <ExternalLink size={17} />
        </a>
        <button className="bottom-icon" type="button" onClick={onClose} title="Закрыть плеер">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
