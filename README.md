# ArikCuts — arikcuts.com

Static portfolio for Arik Ahmed (video editor). Built with **Astro 7 + Vite 8**, deployed to **Cloudflare Workers** assets.

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
3. Rebuild / redeploy — videos are fetched at **build time**.

How fetch works:

- With optional `YOUTUBE_API_KEY` → full playlist via YouTube Data API.
- Without a key → YouTube playlist RSS (about the newest ~15 items).
- Manual `videos` always override matching IDs (title, category, featured).

GitHub Actions rebuilds on every push to `main` and on a **weekly schedule**, so playlist changes land without hand-editing JSON.

Site copy / contact lives in [`src/data/site.json`](src/data/site.json).

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Deploy (Cloudflare Workers)

```bash
npm run deploy
```

Or push to `main` after setting GitHub secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `YOUTUBE_API_KEY` | Optional — full playlist sync |

Attach `arikcuts.com` / `www` in the Cloudflare dashboard (or keep the `routes` in `wrangler.jsonc`). Point DNS to Cloudflare if it isn’t already.
