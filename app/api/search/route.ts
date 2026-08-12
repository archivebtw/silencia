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

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const endpoint = new URL("https://itunes.apple.com/search");
    endpoint.searchParams.set("term", q);
    endpoint.searchParams.set("media", "music");
    endpoint.searchParams.set("entity", "song");
    endpoint.searchParams.set("limit", "18");
    endpoint.searchParams.set("country", "US");
    endpoint.searchParams.set("explicit", "Yes");

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Catalog search failed: ${response.status}`);
    }

    const data = (await response.json()) as { results?: ITunesSong[] };

    const tracks: Track[] = (data.results ?? [])
      .filter((item) => item.trackId && item.trackName && item.artistName)
      .map((item) => ({
        id: String(item.trackId),
        title: item.trackName!,
        artist: item.artistName!,
        album: item.collectionName,
        cover: item.artworkUrl100?.replace("100x100bb", "300x300bb"),
        durationMs: item.trackTimeMillis,
        url: item.trackViewUrl ?? `https://music.apple.com/us/search?term=${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
        previewUrl: item.previewUrl,
        provider: "apple"
      }));

    return NextResponse.json({ tracks, source: "itunes-search" });
  } catch (error) {
    console.error("Silencia search error", error);
    return NextResponse.json(
      { tracks: [], error: "Search is temporarily unavailable" },
      { status: 502 }
    );
  }
}
