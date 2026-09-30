# ArikCuts | arikcuts.com

Static portfolio for Arik Ahmed (video editor). Built with **Astro 7 + Vite 8**, deployed to **GitHub Pages**.

## Work samples (playlist or JSON)

Edit [`src/data/works.json`](src/data/works.json):

```json
{
  "playlistId": "PLxxxxxxxx",
  "videos": [
    {
      "title": "Sample video -01",
      "url": "https://www.youtube.com/watch?v=Ys7tqW2e7tc",
      "category": "Long-form",
      "featured": true
    }
  ]
}
```

### Auto-updating from a YouTube playlist

1. Create a public playlist with your demo edits.
2. Copy the `list=` ID from the playlist URL into `playlistId`.
3. Rebuild / redeploy. Videos are fetched at **build time**.

### Is `YOUTUBE_API_KEY` required?

**No. It is optional.**

| Setup | What you get |
| --- | --- |
| No key (default) | Playlist sync via YouTube RSS (~15 **public** videos). Manual JSON entries still work. |
| With `YOUTUBE_API_KEY` | Full **public** playlist via YouTube Data API (paginated). |

**Unlisted videos never appear in playlist feeds**, even when the playlist itself is public. List those under `videos`.

Entries are **deduped by video ID**. Manual rows override title/category/featured when the same ID is also in the playlist.

To create a key if you want full playlist sync:

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **YouTube Data API v3**
4. Credentials → Create credentials → **API key**
5. Restrict the key to YouTube Data API v3 (recommended)
6. Add it as a repo secret named `YOUTUBE_API_KEY`

## Deploy (GitHub Pages)

Deploys when you:

- Push to `main`
- Run **Actions → Deploy GitHub Pages → Run workflow** (manual)
- Hit the weekly schedule (playlist refresh)

One-time repo setup:

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. Optional custom domain: set `arikcuts.com` under Pages, then add the DNS records GitHub shows
3. Optional secret: `YOUTUBE_API_KEY` (only if you want full playlist API sync)

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Site copy / contact lives in [`src/data/site.json`](src/data/site.json).
