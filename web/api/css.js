// /c/<id>.css (rewritten to /api/css?file=<id>.css) — the CSS itch loads with @import, new on
// each visit. Must answer fast: a hanging @import blanks the page (knowledge base §8).
// No itch data yet: cards show the foil only.

import { build } from '../lib/config.js';
import * as store from '../lib/store.js';

const headers = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' };

export async function GET(request) {
  const id = (new URL(request.url).searchParams.get('file') ?? '').replace(/\.css$/, '');
  const rec = /^[\w-]{8}$/.test(id) ? await store.get(id) : null;
  if (!rec) return new Response('/* itch-live-css: unknown id */\n', { status: 404, headers });
  return new Response(build(rec.form), { headers });
}
