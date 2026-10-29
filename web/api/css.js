// /c/<id>.css (rewritten to /api/css?file=<id>.css) — the CSS itch loads with @import, new on
// each visit. Must answer fast: a hanging @import blanks the page (knowledge base §8), so the
// config comes from memory (store.getCached) and Google Fonts are inlined (no second @import). The
// owner's config (ITCH_OWNER_ID) also gets itch's data for its cards; everyone else's cards show
// the foil only.
// Switches, as Vercel env vars (a redeploy applies them): PAUSED=1 serves nothing to anyone and
// BLOCKED_IDS=id1,id2 serves nothing to those configs. Either way itch shows the page without it.

import { build } from '../lib/config.js';
import { inlineGoogleFonts } from '../lib/googlefonts.js';
import { ownerGames } from '../lib/itch.js';
import * as store from '../lib/store.js';

const headers = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' };

export async function GET(request) {
  const id = (new URL(request.url).searchParams.get('file') ?? '').replace(/\.css$/, '');
  if (process.env.PAUSED) return new Response('/* itch-live-css: paused */\n', { status: 503, headers });
  if ((process.env.BLOCKED_IDS ?? '').split(',').includes(id)) {
    return new Response('/* itch-live-css: this config is blocked */\n', { status: 410, headers });
  }
  let rec;
  try {
    rec = /^[\w-]{8}$/.test(id) ? await store.getCached(id) : null;
  } catch (err) {
    console.error(err.message);
    return new Response('/* itch-live-css: store unavailable */\n', { status: 503, headers });
  }
  if (!rec) return new Response('/* itch-live-css: unknown id */\n', { status: 404, headers });
  let css;
  try {
    css = build(rec.form, id === process.env.ITCH_OWNER_ID ? { data: { games: await ownerGames() } } : {});
  } catch (err) {
    // itch's data in an unexpected shape: the effects without it beat no CSS at all
    console.error(err.message);
    css = build(rec.form);
  }
  return new Response(await inlineGoogleFonts(css), { headers });
}
