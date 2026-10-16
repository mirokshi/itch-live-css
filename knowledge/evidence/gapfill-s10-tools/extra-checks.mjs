// extra-checks.mjs <raw dir> - two more live-render checks (lr.mjs, itch's JS running, no custom CSS):
//  1. jam overview: .jam_body box and side margins at 1280 / 961 / 960 / 800 / 651 / 650 px (crawljam-47 said 0 margin 651-960);
//  2. column-layout profile with many games: lazy covers (data-lazy_src -> src) before and after scrolling, and thumb heights.
// Usage: CDP_PORT=… LR_MIRROR=… LR_RAW=… LR_NEW_IMAGES=placeholder node extra-checks.mjs <raw dir>
import path from 'node:path';
import { open } from './lr.mjs';
const RAW = process.argv[2];
const JAM = { url: 'https://itch.io/jam/game-off-2026', snapshot: path.join(RAW, 'live-itch_io_jam_game_off_2026.html'), inject: { mode: 'jam_theme', css: '' } };
const LEAFO = { url: 'https://leafo.itch.io/', snapshot: path.join(RAW, 'live-leafo_itch_io_.html'), inject: { mode: 'custom_css', css: '' } };
const out = { jam: {}, lazy: {} };
for (const w of [1280, 961, 960, 800, 651, 650]) {
  const p = await open(JAM, { width: w, height: 900 });
  out.jam[w] = await p.eval(`(() => { const b = document.querySelector('.view_jam_page .jam_body'); const r = b.getBoundingClientRect(); const c = getComputedStyle(b); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), clientW: document.documentElement.clientWidth, marginL: c.marginLeft, marginR: c.marginRight, radius: c.borderTopLeftRadius }; })()`);
  await p.close();
}
const lazy = `(() => { const imgs = [...document.querySelectorAll('.game_thumb img, img.lazy_loaded, img[data-lazy_src]')]; const thumbs = [...document.querySelectorAll('.game_cell .game_thumb')].map((t) => Math.round(t.getBoundingClientRect().height)); return { imgs: imgs.length, withLazyAttr: imgs.filter((i) => i.dataset.lazy_src).length, withSrc: imgs.filter((i) => i.getAttribute('src')).length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, cells: thumbs.length, thumbHeights: [...new Set(thumbs)].slice(0, 6) }; })()`;
const p = await open(LEAFO, { width: 1280, height: 900 });
out.lazy.atLoad = await p.eval(lazy);
await p.eval('(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } return true; })()');
await p.idle(800);
out.lazy.afterScroll = await p.eval(lazy);
await p.close();
console.log(JSON.stringify(out, null, 1));
