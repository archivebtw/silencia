"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Headphones,
  Heart,
  Link2,
  ListMusic,
  Music,
  Play,
  Search,
  Sparkles
} from "lucide-react";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { ProviderBadge } from "@/components/ProviderBadge";
import { parseMediaUrl, providerSearchLinks } from "@/lib/providers";
import type { ParsedMedia, Track } from "@/lib/types";

function formatDuration(ms?: number) {
  if (!ms) return "—";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function trackQuery(track: Track) {
  return `${track.artist} ${track.title}`;
}

export default function Home() {
  const [link, setLink] = useState("");
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeMedia, setActiveMedia] = useState<ParsedMedia | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");

  const providerLinks = useMemo(() => providerSearchLinks(query), [query]);

  function importLink(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMediaUrl(link);
    if (!parsed) {
      setMessage("Не получилось распознать ссылку. Проверь адрес и попробуй ещё раз.");
      return;
    }
    setActiveMedia(parsed);
    setMessage("");
    requestAnimationFrame(() => document.querySelector("#player")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function searchTracks(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setHasSearched(true);
    setMessage("");
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка поиска");
      setTracks(data.tracks ?? []);
    } catch {
      setTracks([]);
      setMessage("Поиск временно недоступен. При этом ссылки Spotify и SoundCloud продолжат работать без API-ключей.");
    } finally {
      setSearching(false);
    }
  }

  function playTrack(track: Track) {
    if (!track.previewUrl) {
      setMessage("Для этого результата каталог не отдал аудиопревью. Можно открыть трек в одном из сервисов справа.");
      return;
    }

    setActiveMedia({
      provider: "apple",
      sourceUrl: track.url,
      audioUrl: track.previewUrl,
      label: track.title,
      subtitle: track.artist,
      cover: track.cover,
      playableInline: true,
      preview: true
    });
    setMessage("");
    requestAnimationFrame(() => document.querySelector("#player")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#top">
          <span className="brand-mark"><Music size={21} /></span>
          <span>silenc<span>ia</span></span>
        </a>

        <nav>
          <a className="nav-item active" href="#top"><Sparkles size={18} /> Главная</a>
          <a className="nav-item" href="#search"><Search size={18} /> Поиск</a>
          <a className="nav-item" href="#player"><Headphones size={18} /> Плеер</a>
        </nav>

        <div className="sidebar-section">
          <p>Моя музыка</p>
          <button className="nav-item ghost"><Heart size={18} /> Любимые</button>
          <button className="nav-item ghost"><Clock3 size={18} /> Недавние</button>
          <button className="nav-item ghost"><ListMusic size={18} /> Плейлисты</button>
        </div>

        <div className="sidebar-card">
          <span className="online-dot" />
          <strong>Без API-ключей</strong>
          <p>Spotify · SoundCloud · Яндекс + открытый поиск</p>
        </div>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <div>
            <span className="eyebrow">ALL YOUR MUSIC · ONE PLACE</span>
            <h1>Музыка без<br /><span>границ.</span></h1>
            <p className="hero-copy">
              Вставляй ссылки из музыкальных сервисов или просто напиши название трека и исполнителя. Никаких Spotify Developer ключей для запуска Silencia не требуется.
            </p>
          </div>
          <div className="profile-chip">
            <div className="avatar">S</div>
            <div><strong>Silencia</strong><span>no-key mode</span></div>
          </div>
        </header>

        <div className="hero-grid">
          <form className="panel import-panel" onSubmit={importLink}>
            <div className="panel-title"><Link2 size={18} /> Быстрый импорт</div>
            <h2>Вставь ссылку на музыку</h2>
            <p>Spotify и SoundCloud откроются прямо внутри Silencia. Яндекс Музыка — через официальный источник.</p>
            <div className="input-row">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
              />
              <button className="primary-button" type="submit">Открыть <ArrowRight size={18} /></button>
            </div>
            <div className="source-row">
              <span className="source spotify">S</span>
              <span className="source soundcloud">SC</span>
              <span className="source yandex">Я</span>
              <span className="muted">без Client ID и Client Secret</span>
            </div>
          </form>

          <div className="panel stat-panel">
            <span className="stat-kicker">NO-KEY ARCHITECTURE</span>
            <strong>0 API secrets</strong>
            <p>Импорт ссылок работает через официальные embeds, а обычный поиск — через открытый музыкальный каталог.</p>
            <div className="waveform" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => <i key={i} style={{ height: `${18 + ((i * 17) % 55)}%` }} />)}
            </div>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <section className="search-section" id="search">
          <div className="section-heading">
            <div><span className="eyebrow">DISCOVER</span><h2>Найди трек</h2></div>
            <span className="muted">Открытый поиск · встроенные 30-секундные превью · без регистрации разработчика</span>
          </div>

          <form className="search-box" onSubmit={searchTracks}>
            <Search size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: The Weeknd Blinding Lights"
            />
            <button className="primary-button" type="submit" disabled={searching}>
              {searching ? "Ищу..." : "Найти"}
            </button>
          </form>

          {query.trim() && (
            <div className="external-searches">
              <span>Полная версия в:</span>
              <a href={providerLinks.spotify} target="_blank" rel="noreferrer">Spotify</a>
              <a href={providerLinks.soundcloud} target="_blank" rel="noreferrer">SoundCloud</a>
              <a href={providerLinks.yandex} target="_blank" rel="noreferrer">Яндекс Музыке</a>
              <a href={providerLinks.apple} target="_blank" rel="noreferrer">Apple Music</a>
            </div>
          )}

          <div className="track-list">
            {tracks.length === 0 ? (
              <div className="results-empty">
                <Search size={28} />
                <p>{hasSearched ? "Ничего не найдено. Попробуй имя исполнителя и название трека без лишних слов." : "Введи название трека или исполнителя — результаты появятся здесь."}</p>
              </div>
            ) : tracks.map((track, index) => {
              const links = providerSearchLinks(trackQuery(track));
              return (
                <article className="track-row" key={track.id}>
                  <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="cover-wrap">
                    {track.cover ? <img src={track.cover} alt="" /> : <div className="cover-placeholder"><Music size={18} /></div>}
                    <button className="cover-play" onClick={() => playTrack(track)} aria-label={`Слушать ${track.title}`} disabled={!track.previewUrl}><Play size={17} fill="currentColor" /></button>
                  </div>
                  <div className="track-main"><strong>{track.title}</strong><span>{track.artist}</span></div>
                  <div className="track-album">{track.album}</div>
                  <ProviderBadge provider={track.provider} />
                  <time>{formatDuration(track.durationMs)}</time>
                  <div className="track-actions">
                    <button onClick={() => playTrack(track)} disabled={!track.previewUrl} title="Слушать превью"><Play size={15} /></button>
                    <a href={links.spotify} target="_blank" rel="noreferrer" title="Найти в Spotify"><ExternalLink size={14} /></a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="player-section" id="player">
          <div className="section-heading">
            <div><span className="eyebrow">NOW PLAYING</span><h2>Silencia Player</h2></div>
            <span className="muted">Spotify/SoundCloud embed или каталог-превью</span>
          </div>
          <EmbedPlayer media={activeMedia} />
        </section>
      </section>
    </main>
  );
}
