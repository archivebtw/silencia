export type Provider = "spotify" | "soundcloud" | "youtube" | "yandex" | "apple" | "unknown";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  durationMs?: number;
  url: string;
  previewUrl?: string;
  provider: Provider;
};

export type ParsedMedia = {
  provider: Provider;
  sourceUrl: string;
  embedUrl?: string;
  audioUrl?: string;
  label: string;
  subtitle?: string;
  cover?: string;
  playableInline: boolean;
  preview?: boolean;
};
