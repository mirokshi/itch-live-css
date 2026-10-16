// runtime-checks.mjs - re-runs, with itch's JavaScript running (lr.mjs), the checks that earlier passes made
// in script-free harnesses. Usage:
//   CDP_PORT=9611 LR_MIRROR=<mirror> LR_LOG=<log> LR_RAW=<raw> node runtime-checks.mjs <raw dir> <out dir> [group...]
// groups: grid minheight footer usertools cards gif embed jam
import fs from 'node:fs';
import path from 'node:path';
import { open } from './lr.mjs';

const [RAWDIR, OUT, ...only] = process.argv.slice(2);
const want = (g) => !only.length || only.includes(g);
const snap = (name) => path.join(RAWDIR, name);
const PROFILE = { url: 'https://mirokshi.itch.io/', snapshot: snap('live-mirokshi_itch_io_.html') };
const LEAFO = { url: 'https://leafo.itch.io/', snapshot: snap('live-leafo_itch_io_.html') };
const PIXEL = { url: 'https://orama-interactive.itch.io/pixelorama', snapshot: snap('live-orama_interactive_itch_io_pixelorama.html') };
const JAM = { url: 'https://itch.io/jam/game-off-2026', snapshot: snap('live-itch_io_jam_game_off_2026.html') };
const results = {};
const call = (p, fn, arg) => p.eval(`(${fn.toString()})(${JSON.stringify(arg ?? null)})`);
async function load(doc, css, opts = {}, mode = 'custom_css') { return open({ ...doc, inject: { mode, css } }, opts); }

// ---------- page-side helpers (serialized with toString) ----------
function gridInfo() {
  const g = document.querySelector('.user_game_grid');
  const cs = getComputedStyle(g);
  const cells = [...g.querySelectorAll(':scope > .game_cell')];
  return {
    sizers: [...document.querySelectorAll('style[itchio-grid-sizer]')].map((s) => s.textContent.split('\n').map((l) => l.trim()).join(' ')),
    lastHeadStyle: [...document.head.querySelectorAll('style')].map((s) => s.id || (s.hasAttribute('itchio-grid-sizer') ? 'sizer' : '?')).join(' > '),
    cols: cs.gridTemplateColumns, colGap: cs.columnGap, rowGap: cs.rowGap, varGap: cs.getPropertyValue('--itchio_grid_gap').trim(),
    gridW: Math.round(g.clientWidth), gridScrollW: g.scrollWidth, cellW: cells.map((c) => Math.round(c.getBoundingClientRect().width)),
    docScrollW: document.documentElement.scrollWidth, innerW: innerWidth,
  };
}
function minHeightInfo() {
  const w = document.getElementById('wrapper');
  return { inline: w.getAttribute('style'), computed: getComputedStyle(w).minHeight, height: Math.round(w.getBoundingClientRect().height), innerH: innerHeight };
}
function footerInfo() {
  const w = document.getElementById('wrapper'), f = w.querySelector(':scope > .footer'), up = w.querySelector('.user_page');
  // the last in-flow content box: the lowest bottom edge among .user_page's descendants that are visible
  let contentBottom = 0;
  for (const el of up.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.height > 0 && getComputedStyle(el).position !== 'fixed') contentBottom = Math.max(contentBottom, r.bottom + scrollY); }
  const fr = f.getBoundingClientRect();
  return { wrapperMinH: w.style.minHeight, wrapperH: Math.round(w.getBoundingClientRect().height), userPageBottom: Math.round(up.getBoundingClientRect().bottom + scrollY), contentBottom: Math.round(contentBottom), footerTop: Math.round(fr.top + scrollY), footerH: Math.round(fr.height), gapAboveFooter: Math.round(fr.top + scrollY - contentBottom), docH: document.documentElement.scrollHeight, innerH: innerHeight };
}
function userToolsHit() {
  const ut = document.getElementById('user_tools');
  if (!ut) return { userTools: null };
  const btn = ut.querySelector('a, button') || ut;
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  const cs = getComputedStyle(ut);
  return { cls: ut.className, opacity: cs.opacity, zIndex: cs.zIndex, position: cs.position, btn: btn.tagName + '.' + btn.className, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], hit: hit ? (hit.id ? '#' + hit.id : hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0]) : null, hitIsButton: !!hit && (hit === btn || btn.contains(hit)), x: Math.round(x), y: Math.round(y) };
}
function cardInfo() {
  const cells = [...document.querySelectorAll('.user_game_grid > .game_cell')];
  return cells.map((c) => {
    const img = c.querySelector('.game_thumb img');
    const r = c.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), title: (c.querySelector('.game_title') || {}).textContent?.trim().slice(0, 30), imgLoaded: !!img && img.complete && img.naturalWidth > 0, imgNat: img ? img.naturalWidth + 'x' + img.naturalHeight : null, thumbH: Math.round((c.querySelector('.game_thumb') || c).getBoundingClientRect().height), inlineW: c.style.width || null };
  });
}
function gifInfo() {
  const o = document.querySelector('.gif_overlay');
  if (!o) return null;
  const cs = getComputedStyle(o);
  return { inline: o.getAttribute('style'), computedBg: cs.backgroundImage.slice(0, 90), display: cs.display, opacity: cs.opacity, hovered: o.closest('.game_cell').matches(':hover') };
}
function gifCenter() { const c = document.querySelector('.gif_overlay').closest('.game_cell'); c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
function embedInfo() {
  const ic = document.getElementById('inner_column'), cs = getComputedStyle(ic);
  const fr = document.querySelector('.game_frame');
  return { inline: ic.getAttribute('style'), width: cs.width, maxWidth: cs.maxWidth, overflowX: cs.overflowX, frame: fr ? fr.getAttribute('style') + ' / ' + Math.round(fr.getBoundingClientRect().width) : null, docScrollW: document.documentElement.scrollWidth, innerW: innerWidth, isMobile: window.I && I.is_mobile ? I.is_mobile() : null };
}
function jamInfo() {
  const blocks = [...document.querySelectorAll('.countdown .time_block')].map((b) => ({ name: b.dataset.name, cls: b.className, display: getComputedStyle(b).display, value: (b.querySelector('.block_value') || {}).textContent }));
  const skip = document.querySelector('a.skip_to_main');
  const id = skip ? skip.getAttribute('href').slice(1) : null;
  const target = id ? document.getElementById(id) : null;
  return { label: (document.querySelector('.countdown .countdown_label') || {}).textContent, blocks, skipHref: skip && skip.getAttribute('href'), skipTarget: target ? target.tagName.toLowerCase() + '.' + target.className.split(' ').slice(0, 3).join('.') + ' tabindex=' + target.getAttribute('tabindex') + ' insideWrapper=' + !!target.closest('#wrapper') : null };
}

// ---------- groups ----------
if (want('grid')) {
  const V = {
    none: '',
    'class-only (0,2,0)': '.mode_grid .user_game_grid{grid-template-columns:repeat(2,1fr)}',
    '#wrapper .mode_grid .user_game_grid': '#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(2,1fr)}',
    '#wrapper .user_game_grid': '#wrapper .user_game_grid{grid-template-columns:repeat(2,1fr)}',
    'var on #wrapper': '#wrapper{--itchio_grid_gap:31px}',
    'var on #wrapper .user_page': '#wrapper .user_page{--itchio_grid_gap:31px}',
    'var on #wrapper .user_game_grid': '#wrapper .user_game_grid{--itchio_grid_gap:31px}',
    'column-gap on #wrapper .user_game_grid': '#wrapper .user_game_grid{column-gap:31px}',
  };
  results.grid = {};
  for (const [k, css] of Object.entries(V)) {
    const p = await load(PROFILE, css, { width: 1280, height: 900 });
    const a = await call(p, gridInfo);
    // shrink the window: itch's resize handler rebuilds the sizer <style>
    await p.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 1000));
    const b = await call(p, gridInfo);
    results.grid[k] = { css, at1280: a, afterResizeTo900: b };
    await p.close();
  }
  for (const [k, css] of Object.entries({ none: '', 'one column under 500px': '@media (max-width:500px){#wrapper .mode_grid .user_game_grid{grid-template-columns:1fr}}' })) {
    const p = await load(PROFILE, css, { width: 420, height: 800 });
    results.grid['420px: ' + k] = { css, at420: await call(p, gridInfo) };
    await p.close();
  }
}

if (want('minheight')) {
  results.minheight = {};
  for (const [k, css] of Object.entries({ none: '', 'min-height:0': '#wrapper{min-height:0}', 'min-height:0 !important': '#wrapper{min-height:0!important}' })) {
    const p = await load(PROFILE, css, { width: 1280, height: 900 });
    const a = await call(p, minHeightInfo);
    await p.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 600, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 1000));
    results.minheight[k] = { css, at900: a, afterResizeTo600: await call(p, minHeightInfo) };
    await p.close();
  }
}

if (want('footer')) {
  results.footer = {};
  const V = { none: '', 'footer margin-top:48px': '#wrapper .footer{margin-top:48px}', '#wrapper padding-bottom:0': '#wrapper{padding-bottom:0}', 'footer margin-bottom:20px': '#wrapper .footer{margin-bottom:20px}', '#wrapper padding-bottom:110px': '#wrapper{padding-bottom:110px}' };
  for (const h of [900, 400]) for (const [k, css] of Object.entries(V)) {
    const p = await load(PROFILE, css, { width: 1280, height: h });
    results.footer[`h${h} ${k}`] = { css, ...(await call(p, footerInfo)) };
    await p.close();
  }
}

if (want('usertools')) {
  results.usertools = {};
  const layer = '#wrapper::after{content:"";position:fixed;inset:0;z-index:5000;background:rgba(255,0,0,.25)}';
  const V = {
    none: '',
    'fixed #wrapper::after z5000': layer,
    'same + #wrapper{isolation:isolate}': layer + '#wrapper{isolation:isolate}',
    'same + pointer-events:none (no isolation)': layer.replace('}', ';pointer-events:none}'),
    'layer inside bio (.user_profile::after) z5000': '.user_page .user_profile::after{content:"";position:fixed;inset:0;z-index:5000;background:rgba(255,0,0,.25)}',
  };
  for (const [doc, name] of [[PROFILE, 'mirokshi (grid)'], [LEAFO, 'leafo (column)']]) for (const [k, css] of Object.entries(V)) {
    const p = await load(doc, css, { width: 1280, height: 900 });
    const r = await call(p, userToolsHit);
    if (r.rect && k !== 'layer inside bio (.user_profile::after) z5000') await p.shot(path.join(OUT, `usertools-${name.split(' ')[0]}-${Object.keys(V).indexOf(k)}.png`), { x: r.rect[0] - 20, y: 0, width: r.rect[2] + 40, height: r.rect[3] + 30 });
    results.usertools[`${name} / ${k}`] = { css, ...r };
    await p.close();
  }
}

if (want('cards')) {
  results.cards = {};
  const fix = '#wrapper .game_grid_widget{align-items:stretch;grid-auto-rows:1fr}#wrapper .game_cell{display:flex;flex-direction:column}#wrapper .game_cell_data{flex:1 0 auto}';
  for (const w of [1280, 900]) for (const [k, css] of Object.entries({ none: '', 'repo-33 fix': fix, 'align-items:stretch only': '#wrapper .game_grid_widget{align-items:stretch}' })) {
    const p = await load(PROFILE, css, { width: w, height: 900 });
    results.cards[`${w}px ${k}`] = { css, cells: await call(p, cardInfo) };
    await p.close();
  }
}

if (want('gif')) {
  results.gif = {};
  for (const [k, css] of Object.entries({ none: '', 'background-image:none': '#wrapper .gif_overlay{background-image:none}', 'background-image:none !important': '#wrapper .gif_overlay{background-image:none!important}', 'display:none': '#wrapper .gif_overlay{display:none}' })) {
    const p = await load(PROFILE, css, { width: 1280, height: 900 });
    const before = await call(p, gifInfo);
    const [x, y] = await call(p, gifCenter);
    await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await new Promise((r) => setTimeout(r, 300)); await p.idle();
    results.gif[k] = { css, before, afterHover: await call(p, gifInfo) };
    await p.close();
  }
}

if (want('embed')) {
  results.embed = {};
  for (const [k, css] of Object.entries({ none: '', 'max-width:960px': '#wrapper #inner_column{max-width:960px}', 'max-width:960px;width:auto !important': '#wrapper #inner_column{max-width:960px!important;width:auto!important}' })) {
    for (const w of [1400, 1000, 800, 375]) {
      const p = await load(PIXEL, css, { width: w, height: 900 });
      results.embed[`${k} @${w}`] = { css, ...(await call(p, embedInfo)) };
      await p.close();
      if (k !== 'none') break; // overrides: one width is enough
    }
  }
}

if (want('jam')) {
  const p = await load(JAM, '', { width: 1280, height: 900 }, 'jam_theme');
  results.jam = await call(p, jamInfo);
  results.jam.serverSent = (() => { const s = fs.readFileSync(JAM.snapshot, 'utf8'); const m = s.match(/<div class="countdown[\s\S]{0,1500}/); return m ? m[0].replace(/\s+/g, ' ').slice(0, 600) : null; })();
  results.jam.serverSkip = (fs.readFileSync(JAM.snapshot, 'utf8').match(/<a[^>]*skip_to_main[^>]*>/) || [null])[0];
  await p.close();
  // skip links on the other page types, after JS
  for (const [doc, name] of [[PROFILE, 'profile'], [PIXEL, 'project']]) {
    const q = await load(doc, '', { width: 1280, height: 900 });
    results.jam['skip links on ' + name] = await q.eval('document.querySelectorAll("a.skip_to_main").length');
    await q.close();
  }
}

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'runtime-' + (only.join('-') || 'all') + '.json');
fs.writeFileSync(file, JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
