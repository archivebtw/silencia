import { NextRequest, NextResponse } from "next/server";
import type { Track } from "@/lib/types";

type ITunesSong = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  previewUrl?: string;
};

type MusicBrainzRecording = {
  id?: string;
  title?: string;
  length?: number;
  score?: number;
  "artist-credit"?: Array<{
    name?: string;
    artist?: { name?: string };
    joinphrase?: string;
  }>;
  releases?: Array<{ title?: string }>;
};

type RankedTrack = Track & { rank: number };

const APPLE_STOREFRONTS = ["US", "GB", "DE", "KZ", "RU"];
const MAX_RESULTS = 140;

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function dedupeKey(track: Track) {
  return `${normalize(track.title)}::${normalize(track.artist)}`;
}

function relevance(track: Track, query: string) {
  const q = normalize(query);
  const title = normalize(track.title);
  const artist = normalize(track.artist);
  const combined = `${artist} ${title}`;

  if (combined === q || title === q || artist === q) return 1000;
  if (combined.includes(q)) return 850;

  const tokens = q.split(" ").filter(Boolean);
  const hits = tokens.filter((token) => combined.includes(token)).length;
  return hits * 80;
}

async function searchApple(query: string): Promise<RankedTrack[]> {
  const requests = APPLE_STOREFRONTS.map(async (country, storefrontIndex) => {
    const endpoint = new URL("https://itunes.apple.com/search");
    endpoint.searchParams.set("term", query);
    endpoint.searchParams.set("media", "music");
    endpoint.searchParams.set("entity", "song");
    endpoint.searchParams.set("limit", "100");
    endpoint.searchParams.set("country", country);
    endpoint.searchParams.set("explicit", "Yes");

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 180 }
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { results?: ITunesSong[] };
    return (data.results ?? [])
      .filter((item) => item.trackId && item.trackName && item.artistName)
      .map<RankedTrack>((item, index) => ({
        id: `apple-${country}-${item.trackId}`,
        title: item.trackName!,
        artist: item.artistName!,
        album: item.collectionName,
        cover: item.artworkUrl100?.replace("100x100bb", "300x300bb"),
        durationMs: item.trackTimeMillis,
        url:
          item.trackViewUrl ??
          `https://music.apple.com/${country.toLowerCase()}/search?term=${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
        previewUrl: item.previewUrl,
        provider: "apple",
        rank: relevance(
          {
            id: "",
            title: item.trackName!,
            artist: item.artistName!,
            url: "",
            provider: "apple"
          },
          query
        ) + 300 - storefrontIndex * 5 - index * 0.1
      }));
  });

  const settled = await Promise.allSettled(requests);
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function musicBrainzArtist(recording: MusicBrainzRecording) {
  const credit = recording["artist-credit"] ?? [];
  return credit
    .map((part) => `${part.name ?? part.artist?.name ?? ""}${part.joinphrase ?? ""}`)
    .join("")
    .trim();
}

async function searchMusicBrainz(query: string): Promise<RankedTrack[]> {
  const endpoint = new URL("https://musicbrainz.org/ws/2/recording/");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("fmt", "json");
  endpoint.searchParams.set("limit", "100");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Silencia/0.3 (https://github.com/archivebtw/silencia)"
    },
    next: { revalidate: 300 }
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { recordings?: MusicBrainzRecording[] };

  return (data.recordings ?? [])
    .map<RankedTrack | null>((recording, index) => {
      const artist = musicBrainzArtist(recording);
      if (!recording.id || !recording.title || !artist) return null;

      const track: Track = {
        id: `mb-${recording.id}`,
        title: recording.title,
        artist,
        album: recording.releases?.[0]?.title,
        durationMs: recording.length,
        url: `https://musicbrainz.org/recording/${recording.id}`,
        provider: "musicbrainz"
      };

      return {
        ...track,
        rank: relevance(track, query) + Math.min(recording.score ?? 0, 100) - index * 0.05
      };
    })
    .filter((track): track is RankedTrack => Boolean(track));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ tracks: [], total: 0, sources: [] });
  }

  try {
    const [appleResult, musicBrainzResult] = await Promise.allSettled([
      searchApple(q),
      searchMusicBrainz(q)
    ]);

    const candidates = [
      ...(appleResult.status === "fulfilled" ? appleResult.value : []),
      ...(musicBrainzResult.status === "fulfilled" ? musicBrainzResult.value : [])
    ].sort((a, b) => b.rank - a.rank);

    const unique = new Map<string, RankedTrack>();

    for (const candidate of candidates) {
      const key = dedupeKey(candidate);
      const existing = unique.get(key);

      if (!existing) {
        unique.set(key, candidate);
        continue;
      }

      // Prefer a result that can actually be previewed in Silencia.
      if (!existing.previewUrl && candidate.previewUrl) {
        unique.set(key, candidate);
      }
    }

    const tracks: Track[] = Array.from(unique.values())
      .sort((a, b) => b.rank - a.rank)
      .slice(0, MAX_RESULTS)
      .map(({ rank: _rank, ...track }) => track);

    return NextResponse.json({
      tracks,
      total: unique.size,
      sources: ["apple-multi-storefront", "musicbrainz"]
    });
  } catch (error) {
    console.error("Silencia search error", error);
    return NextResponse.json(
      { tracks: [], total: 0, error: "Search is temporarily unavailable" },
      { status: 502 }
    );
  }
}
