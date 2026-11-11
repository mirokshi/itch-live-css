// Google Fonts inside /c/<id>.css. An @import in a sheet that was itself imported only starts once
// that sheet has arrived: one more round trip before the page can paint (knowledge base §8). So
// the server fetches Google's CSS (its @font-face rules) and puts it in place of the @import, kept
// in memory for a day. If Google is slow or fails, the @import stays as it was.

import { minify } from '../../engine/src/css.js';
import { LEADING } from './config.js';

const TTL = 24 * 60 * 60 * 1000;
const RETRY = 5 * 60 * 1000;
const TIMEOUT = 1500;
// Google answers each browser with the font format it supports: this one gets woff2
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IMPORT = /@import\s+url\(\s*(["']?)(https:\/\/fonts\.googleapis\.com\/css2\?[^"')\s]+)\1\s*\)\s*;/g;

// The URLs come from users' CSS, so both are capped: a sheet can't make the server fetch hundreds of
// them, and made-up ones can't fill the memory. Past MAX_PER_SHEET the @import stays as written.
const MAX_PER_SHEET = 8;
const MAX_URLS = 200;

const cache = new Map(); // url → { css, until }; css null after a failure
function keep(url, entry) {
  cache.delete(url); // back of the line: the oldest goes first
  cache.set(url, entry);
  if (cache.size > MAX_URLS) cache.delete(cache.keys().next().value);
  return entry.css;
}

async function fontCss(url) {
  const kept = cache.get(url);
  if (kept && Date.now() < kept.until) return kept.css;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT) });
    const css = await res.text();
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('text/css') || !css.includes('@font-face')) {
      throw new Error(`HTTP ${res.status}`);
    }
    return keep(url, { css: minify(css), until: Date.now() + TTL });
  } catch (err) {
    console.error('Google Fonts:', err.message);
    return keep(url, { css: kept?.css ?? null, until: Date.now() + RETRY });
  }
}

// served CSS → the same, with each leading Google Fonts @import replaced by its @font-face rules
export async function inlineGoogleFonts(css) {
  const lead = css.match(LEADING)[0];
  const found = [...lead.matchAll(IMPORT)].slice(0, MAX_PER_SHEET);
  if (!found.length) return css;
  const faces = await Promise.all(found.map((m) => fontCss(m[2])));
  let kept = lead;
  found.forEach((m, i) => {
    if (faces[i]) kept = kept.replace(m[0], '');
  });
  // rules can't go before an @import (R9): the inlined ones follow the imports that stay
  return `${kept.trim()}\n${faces.filter(Boolean).join('\n')}\n${css.slice(lead.length).trimStart()}`.trimStart();
}
