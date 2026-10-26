// The owner's games from itch's API (https://api.itch.io/profile/games): id, views, downloads and
// publish date of every published game the key's account manages. Ported from the private repo's
// custom-css/lib/itch.js.
// · The key lives in the ITCH_API_KEY env var (Vercel → Settings → Environment Variables), never in
//   code. Only the config named in ITCH_OWNER_ID gets the data: views and downloads are the owner's
//   private stats, not for anyone else's CSS.
// · No key, or itch fails or is slow: the last list it had (or none); the cards show the foil only.
// · Kept in memory for 1 h. /c/<id>.css waits on the call, so it gives up after 1.5 s, and after a
//   failure it doesn't retry for 5 min.
// shortcut: the first visit after the hour waits on itch (≤ 1.5 s); a cron that fills the cache
// ahead would take itch off the visitor's path (ROADMAP H5)

const API = 'https://api.itch.io/profile/games';
const TTL = 60 * 60 * 1000;
const RETRY = 5 * 60 * 1000;
const TIMEOUT = 1500;

let cache = { until: 0, games: [] };

export async function ownerGames() {
  const key = process.env.ITCH_API_KEY;
  if (!key || Date.now() < cache.until) return cache.games;
  try {
    const res = await fetch(API, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(TIMEOUT) });
    const body = await res.json();
    if (!res.ok || !Array.isArray(body.games)) throw new Error(`HTTP ${res.status} ${body.errors ?? ''}`);
    const games = body.games
      .filter((g) => g.published)
      .map((g) => ({
        id: g.id,
        views: g.views_count ?? 0,
        downloads: g.downloads_count ?? 0,
        published: Date.parse(g.published_at),
      }));
    cache = { until: Date.now() + TTL, games };
  } catch (err) {
    console.error('itch API:', err.message); // the key is in the header, never in the message
    cache.until = Date.now() + RETRY;
  }
  return cache.games;
}
