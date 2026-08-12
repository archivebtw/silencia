import type { ParsedMedia } from "./types";

function safeUrl(input: string) {
  try {
    return new URL(input.trim());
  } catch {
    return null;
  }
}

export function parseMediaUrl(input: string): ParsedMedia | null {
  const url = safeUrl(input);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "open.spotify.com") {
    const [, type, id] = url.pathname.split("/");
    const allowed = new Set(["track", "album", "playlist", "episode", "show", "artist"]);

    if (type && id && allowed.has(type)) {
      return {
        provider: "spotify",
        sourceUrl: url.toString(),
        embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
        label: `Spotify ${type}`,
        playableInline: true
      };
    }
  }

  if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
    return {
      provider: "soundcloud",
      sourceUrl: url.toString(),
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url.toString()
      )}&color=%238d7cff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`,
      label: "SoundCloud",
      playableInline: true
    };
  }

  if (host === "music.yandex.ru" || host === "music.yandex.com") {
    return {
      provider: "yandex",
      sourceUrl: url.toString(),
      label: "Яндекс Музыка",
      playableInline: false
    };
  }

  return {
    provider: "unknown",
    sourceUrl: url.toString(),
    label: host,
    playableInline: false
  };
}

export function providerSearchLinks(query: string) {
  const clean = query.trim();
  const q = encodeURIComponent(clean);
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    soundcloud: `https://soundcloud.com/search/sounds?q=${q}`,
    yandex: `https://music.yandex.ru/search?text=${q}`,
    apple: `https://music.apple.com/us/search?term=${q}`
  };
}
