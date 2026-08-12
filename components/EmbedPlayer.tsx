"use client";

import { ExternalLink, Link2, Music2 } from "lucide-react";
import type { ParsedMedia } from "@/lib/types";
import { ProviderBadge } from "./ProviderBadge";

export function EmbedPlayer({ media }: { media: ParsedMedia | null }) {
  if (!media) {
    return (
      <div className="player-empty">
        <div className="empty-icon"><Music2 size={28} /></div>
        <div>
          <strong>Здесь появится плеер</strong>
          <p>Вставь ссылку Spotify, SoundCloud или YouTube либо выбери трек из поиска Silencia.</p>
        </div>
      </div>
    );
  }

  if (media.audioUrl) {
    return (
      <div className="audio-card">
        {media.cover ? (
          <img className="audio-cover" src={media.cover} alt="" />
        ) : (
          <div className="audio-cover placeholder"><Music2 size={30} /></div>
        )}

        <div className="audio-content">
          <div className="audio-topline">
            <ProviderBadge provider={media.provider} />
            {media.preview && <span className="preview-note">встроенное превью</span>}
          </div>

          <h3>{media.label}</h3>
          {media.subtitle && <p>{media.subtitle}</p>}

          <audio
            key={media.audioUrl}
            controls
            autoPlay
            preload="auto"
            src={media.audioUrl}
          >
            Браузер не поддерживает HTML5 Audio.
          </audio>

          <p className="audio-help">
            Если браузер запретил автозапуск со звуком, нажми Play на панели выше.
          </p>

          <a href={media.sourceUrl} target="_blank" rel="noreferrer" className="text-link">
            Открыть источник <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  if (media.playableInline && media.embedUrl) {
    const height = media.provider === "soundcloud" ? 300 : media.provider === "youtube" ? 360 : 152;

    return (
      <div className="embed-card">
        <div className="embed-header">
          <div>
            <ProviderBadge provider={media.provider} />
            <h3>{media.label}</h3>
          </div>
          <a href={media.sourceUrl} target="_blank" rel="noreferrer" className="icon-button" title="Открыть источник">
            <ExternalLink size={18} />
          </a>
        </div>
        <iframe
          key={media.embedUrl}
          src={media.embedUrl}
          title={`${media.label} player`}
          width="100%"
          height={height}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className="player-fallback">
      <div className="empty-icon"><Link2 size={26} /></div>
      <div className="fallback-copy">
        <ProviderBadge provider={media.provider} />
        <h3>{media.label}</h3>
        <p>
          Ссылка распознана. Для этого источника Silencia открывает официальный сервис,
          потому что универсального публичного встроенного плеера для него нет.
        </p>
        <a href={media.sourceUrl} target="_blank" rel="noreferrer" className="primary-button compact">
          Открыть трек <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
