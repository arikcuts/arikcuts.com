import worksConfig from '../data/works.json';

export type WorkVideo = {
  id: string;
  title: string;
  url: string;
  category?: string;
  featured?: boolean;
  thumbnail: string;
  embedUrl: string;
};

type ManualVideo = {
  title: string;
  url: string;
  category?: string;
  featured?: boolean;
};

type WorksConfig = {
  playlistId?: string;
  videos: ManualVideo[];
};

const config = worksConfig as WorksConfig;

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const embed = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

function toWorkVideo(
  id: string,
  title: string,
  extras: Partial<Pick<WorkVideo, 'category' | 'featured'>> = {},
): WorkVideo {
  return {
    id,
    title,
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    ...extras,
  };
}

function parseManualVideos(videos: ManualVideo[]): WorkVideo[] {
  return videos.flatMap((video) => {
    const id = extractYouTubeId(video.url);
    if (!id) return [];
    return [
      toWorkVideo(id, video.title, {
        category: video.category,
        featured: video.featured,
      }),
    ];
  });
}

async function fetchPlaylistViaApi(
  playlistId: string,
  apiKey: string,
): Promise<WorkVideo[]> {
  const items: WorkVideo[] = [];
  let pageToken = '';

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          resourceId?: { videoId?: string };
        };
      }>;
    };

    for (const item of data.items ?? []) {
      const id = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (!id || !title || title === 'Private video' || title === 'Deleted video') {
        continue;
      }
      items.push(toWorkVideo(id, title, { category: 'Playlist' }));
    }

    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return items;
}

async function fetchPlaylistViaRss(playlistId: string): Promise<WorkVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  const res = await fetch(feedUrl);
  if (!res.ok) {
    throw new Error(`YouTube RSS ${res.status}`);
  }

  const xml = await res.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const videos: WorkVideo[] = [];

  for (const [, entry] of entries) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry
      .match(/<title>([^<]+)<\/title>/)?.[1]
      ?.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    if (!id || !title) continue;
    videos.push(toWorkVideo(id, title, { category: 'Playlist' }));
  }

  return videos;
}

async function fetchPlaylistVideos(playlistId: string): Promise<WorkVideo[]> {
  const apiKey = import.meta.env.YOUTUBE_API_KEY as string | undefined;

  if (apiKey) {
    try {
      return await fetchPlaylistViaApi(playlistId, apiKey);
    } catch (error) {
      console.warn('[works] YouTube API failed, falling back to RSS:', error);
    }
  }

  try {
    return await fetchPlaylistViaRss(playlistId);
  } catch (error) {
    console.warn('[works] Playlist fetch failed:', error);
    return [];
  }
}

/**
 * Resolves work samples at build time.
 * - Set `playlistId` in works.json to pull videos automatically (rebuild to refresh).
 * - Optional `YOUTUBE_API_KEY` for full playlists (RSS alone caps around 15).
 * - Unlisted videos do not appear in RSS/API-key playlist feeds; list those in `videos`.
 * - Deduped by YouTube video ID. Manual entries override title/category/featured when IDs match.
 */
export async function getWorks(): Promise<WorkVideo[]> {
  const manual = parseManualVideos(config.videos ?? []);
  const manualById = new Map(manual.map((video) => [video.id, video]));

  let playlist: WorkVideo[] = [];
  if (config.playlistId?.trim()) {
    playlist = await fetchPlaylistVideos(config.playlistId.trim());
  }

  // Playlist order first (when available), then any manual-only IDs.
  // Same ID never appears twice; manual metadata wins on collision.
  const mergedById = new Map<string, WorkVideo>();

  for (const video of playlist) {
    const override = manualById.get(video.id);
    mergedById.set(video.id, override ? { ...video, ...override } : video);
  }

  for (const video of manual) {
    if (mergedById.has(video.id)) continue;
    mergedById.set(video.id, video);
  }

  return [...mergedById.values()];
}

export function getFeatured(videos: WorkVideo[]): WorkVideo | undefined {
  return videos.find((video) => video.featured) ?? videos[0];
}
