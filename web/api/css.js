// /c/<id>.css (rewritten to /api/css?file=<id>.css) — the CSS itch loads with @import, new on
// each visit. Must answer fast: a hanging @import blanks the page (knowledge base §8), so the
// config comes from memory (store.getCached). The owner's config (ITCH_OWNER_ID) also gets itch's
// data for its cards; everyone else's cards show the foil only.

import { build } from '../lib/config.js';
import { ownerGames } from '../lib/itch.js';
import * as store from '../lib/store.js';

const headers = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' };

export async function GET(request) {
  const id = (new URL(request.url).searchParams.get('file') ?? '').replace(/\.css$/, '');
  let rec;
  try {
    rec = /^[\w-]{8}$/.test(id) ? await store.getCached(id) : null;
  } catch (err) {
    console.error(err.message);
    return new Response('/* itch-live-css: store unavailable */\n', { status: 503, headers });
  }
  if (!rec) return new Response('/* itch-live-css: unknown id */\n', { status: 404, headers });
  if (id !== process.env.ITCH_OWNER_ID) return new Response(build(rec.form), { headers });
  let css;
  try {
    css = build(rec.form, { data: { games: await ownerGames() } });
  } catch (err) {
    // itch's data in an unexpected shape: the effects without it beat no CSS at all
    console.error(err.message);
    css = build(rec.form);
  }
  return new Response(css, { headers });
}
