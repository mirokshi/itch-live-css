// /api/showcase
//   GET                         → { entries: [{ id, url, name, page }] }   approved only, newest first
//   GET  ?all=1  + Bearer ADMIN_KEY → { entries: [every entry, with status] }
//   POST + Bearer ADMIN_KEY  body: { id, status } → { ok }   approve, reject or send back to pending

import { BadRequest, handle, json, readJson } from '../lib/http.js';
import { isAdmin, STATUSES } from '../lib/showcase.js';
import * as store from '../lib/store.js';

const forbidden = () => json({ error: 'admin key required' }, 403);
const newest = (a, b) => b.at - a.at;

export async function GET(request) {
  const list = await store.getShowcase();
  if (new URL(request.url).searchParams.has('all')) {
    return isAdmin(request) ? json({ entries: [...list].sort(newest) }) : forbidden();
  }
  const entries = list
    .filter((e) => e.status === 'approved')
    .sort(newest)
    .map(({ id, url, name, page }) => ({ id, url, name, page }));
  return json({ entries });
}

export const POST = (request) =>
  handle(async () => {
    if (!isAdmin(request)) return forbidden();
    const { id, status } = (await readJson(request)) ?? {};
    if (!STATUSES.includes(status)) throw new BadRequest(`status must be one of ${STATUSES.join(', ')}`);
    const list = await store.getShowcase();
    const entry = list.find((e) => e.id === id);
    if (!entry) return json({ error: 'no such entry' }, 404);
    entry.status = status;
    await store.setShowcase(list);
    return json({ ok: true });
  });
