// template-checks.mjs - test the starter templates on real pages with itch's JS running (lr.mjs).
//   CDP_PORT=9611 LR_MIRROR=… LR_LOG=… LR_RAW=… LR_NEW_IMAGES=placeholder node template-checks.mjs <raw dir> <out dir> [case…]
// For each case: CSSOM(source) == CSSOM(minified); rules applied; reduced motion; Tab through every stop
// (ring visible and not clipped, or a ring on the enclosing card); exposed h1s (CDP AX tree);
// 320 px reflow; forced colours (panels keep an edge).
import fs from 'node:fs';
import path from 'node:path';
import { open, axRows } from './lr.mjs';

const [RAWDIR, OUT, ...only] = process.argv.slice(2);
const T = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'templates');
const css = (n) => fs.readFileSync(path.join(T, n), 'utf8');
const snap = (n) => path.join(RAWDIR, n);
const CASES = {
  'profile@mirokshi': { tpl: 'profile', mode: 'custom_css', url: 'https://mirokshi.itch.io/', snapshot: snap('live-mirokshi_itch_io_.html') },
  'profile@leafo': { tpl: 'profile', mode: 'custom_css', url: 'https://leafo.itch.io/', snapshot: snap('live-leafo_itch_io_.html') },
  'project@pixelorama': { tpl: 'project', mode: 'custom_css', url: 'https://orama-interactive.itch.io/pixelorama', snapshot: snap('live-orama_interactive_itch_io_pixelorama.html') },
  'project@pixelorama-devlog': { tpl: 'project', mode: 'custom_css', url: 'https://orama-interactive.itch.io/pixelorama/devlog/1664980/pixelorama-v123-is-out-bugfix-update', snapshot: snap('live-orama_interactive_itch_io_pixelorama_devlog_1664980_pixelorama_v123_is_out_bugfix_update.html') },
  'jam@game-off-2026': { tpl: 'jam', mode: 'jam_theme', url: 'https://itch.io/jam/game-off-2026', snapshot: snap('live-itch_io_jam_game_off_2026.html') },
};
const call = (p, fn, arg) => p.eval(`(${fn.toString()})(${JSON.stringify(arg ?? null)})`);

// ---------- page-side helpers ----------
function cssomOf(texts) {
  return texts.map((t) => { const s = new CSSStyleSheet(); s.replaceSync(t); return [...s.cssRules].map((r) => r.cssText); });
}
function applied(tpl) {
  const g = (sel, prop) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).getPropertyValue(prop) : '(no element)'; };
  const out = { wrapperBgImage: g('#wrapper', 'background-image').slice(0, 60), wrapperBgSize: g('#wrapper', 'background-size') };
  if (tpl === 'profile') {
    Object.assign(out, { bioBg: g('.user_profile', 'background-color'), bioLink: g('.user_profile a', 'color'), cardBorder: g('.game_cell', 'border-top-color'), titleColor: g('.game_title a', 'color'), genreColor: g('.game_genre', 'color'), footerColor: g('.footer', 'color'), alignItems: g('.game_grid_widget', 'align-items') });
    const hs = [...document.querySelectorAll('.user_game_grid > .game_cell')].map((c) => Math.round(c.getBoundingClientRect().height));
    out.cardHeights = [...new Set(hs)];
  }
  if (tpl === 'project') Object.assign(out, { panelBg: g('#inner_column', 'background-color'), panelColor: g('#inner_column', 'color'), link: g('.inner_column .formatted_description a, .inner_column .post_body a', 'color'), button: g('.inner_column .button', 'background-color') + ' / ' + g('.inner_column .button', 'color'), bodyLineHeight: g('.formatted_description, .post_body', 'line-height'), h2: g('.inner_column h2', 'color'), commentBorder: g('.game_comments_widget .community_post', 'border-top-color') });
  if (tpl === 'jam') Object.assign(out, { jamBodyBg: g('.view_jam_page .jam_body', 'background-color'), title: g('.jam_title_header', 'font-family') + ' / ' + g('.jam_title_header', 'color'), fontStatus: [...document.fonts].filter((f) => f.family.includes('Custom Hyperlegible')).map((f) => f.status).join(','), button: g('.view_jam_page .button', 'background-color') + ' / ' + g('.view_jam_page .button', 'color'), link: g('.jam_content a', 'color') });
  return out;
}
function motion() {
  const running = document.getAnimations().filter((a) => a.playState === 'running');
  const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); return { animationName: c.animationName, transitionDuration: c.transitionDuration, opacity: c.opacity }; };
  return { running: running.length, runningNames: running.map((a) => a.animationName || a.constructor.name).slice(0, 5), bio: pick('.user_profile'), card: pick('.game_cell'), button: pick('.inner_column .button, .view_jam_page .button') };
}
function ringInfo() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { none: true };
  if (el.__lrVisited) return { again: true };
  el.__lrVisited = true; // JS expando, not a DOM attribute: no style or AX side effects
  const cs = getComputedStyle(el), ow = parseFloat(cs.outlineWidth) || 0, off = parseFloat(cs.outlineOffset) || 0;
  const own = cs.outlineStyle !== 'none' && ow > 0;
  // an inline link wrapping a block image has a 0x0 box of its own; its outline follows the child, so measure the union
  let r = el.getBoundingClientRect();
  if ((r.width === 0 || r.height === 0) && el.children.length) {
    const rs = [...el.children].map((c) => c.getBoundingClientRect()).filter((x) => x.width > 0 && x.height > 0);
    if (rs.length) r = { left: Math.min(...rs.map((x) => x.left)), top: Math.min(...rs.map((x) => x.top)), right: Math.max(...rs.map((x) => x.right)), bottom: Math.max(...rs.map((x) => x.bottom)), width: 1, height: 1 };
  }
  const out = Math.max(0, ow + off); // how far the ring reaches outside the border box (0 for an inset ring)
  const ext = { l: r.left - out, t: r.top - out, r: r.right + out, b: r.bottom + out };
  let clippedBy = null;
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
      const ar = a.getBoundingClientRect();
      if (ext.l < ar.left - 0.5 || ext.t < ar.top - 0.5 || ext.r > ar.right + 0.5 || ext.b > ar.bottom + 0.5) { clippedBy = (a.id ? '#' + a.id : '') + '.' + String(a.className).split(' ')[0]; break; }
    }
  }
  const card = el.closest('.game_cell');
  let cardRing = null;
  if (card) { const c = getComputedStyle(card); if (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) cardRing = c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor; }
  const visible = r.width > 0 && r.height > 0;
  const inWrap = !!el.closest('#wrapper');
  return { key: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + '|' + (el.getAttribute('href') || el.textContent.trim().slice(0, 20)), inWrap, outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' offset ' + cs.outlineOffset, own, clippedBy, cardRing, visible, pass: inWrap ? visible && ((own && !clippedBy) || !!cardRing) : null };
}
function reflow(deviceWidth) {
  const W = deviceWidth, offenders = [];
  for (const e of document.querySelectorAll('#wrapper *')) {
    const r = e.getBoundingClientRect();
    if (r.right > W + 1 && r.width > 0) {
      let clipped = false;
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== 'visible' && a.getBoundingClientRect().right <= W + 1) { clipped = true; break; } }
      if (!clipped) offenders.push((e.id ? '#' + e.id : e.tagName.toLowerCase()) + '.' + String(e.className).split(' ')[0] + ' right=' + Math.round(r.right) + (e.getAttribute('style') ? ' style=' + e.getAttribute('style').slice(0, 50) : ''));
    }
  }
  return { deviceWidth: W, innerWidth, scrollWidth: document.documentElement.scrollWidth, horizontalScroll: document.documentElement.scrollWidth > W, isMobileUA: !!(window.I && I.is_mobile && I.is_mobile()), offenders: offenders.slice(0, 6), offenderCount: offenders.length };
}
function forced() {
  const edge = (sel) => { const e = document.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); return c.borderTopStyle + ' ' + c.borderTopWidth + ' ' + c.borderTopColor + ' | outline ' + c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor + ' | bg ' + c.backgroundColor + ' | shadow ' + c.boxShadow.slice(0, 30); };
  return { forcedColors: matchMedia('(forced-colors: active)').matches, card: edge('.game_cell'), bio: edge('.user_profile'), panel: edge('#inner_column'), jamBody: edge('.view_jam_page .jam_body'), button: edge('.inner_column .button, .view_jam_page .button') };
}

// ---------- run ----------
const results = {};
for (const [name, c] of Object.entries(CASES)) {
  if (only.length && !only.includes(name)) continue;
  const src = css(c.tpl + '.css'), min = css(c.tpl + '.min.css');
  const doc = { url: c.url, snapshot: c.snapshot };
  const R = (results[name] = { template: c.tpl, minChars: min.trimEnd().length, minBytes: Buffer.byteLength(min.trimEnd()) });

  // 1. desktop: CSSOM equality, applied values, motion, keyboard, headings
  let p = await open({ ...doc, inject: { mode: c.mode, css: min } }, { width: 1280, height: 900 });
  const [a, b] = await call(p, cssomOf, [src, min]);
  // custom-property values keep author whitespace in CSSOM; compare them without it (see cssom-equal.mjs)
  const norm = (list) => JSON.stringify(list.map((s) => s.replace(/(--[\w-]+:)([^;}]*)/g, (m, k, v) => k + v.replace(/\s+/g, ''))));
  R.cssomEqual = norm(a) === norm(b); R.ruleCount = a.length;
  R.applied = await call(p, applied, c.tpl);
  R.motionDefault = await call(p, motion);
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await p.eval('document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); true');
  const stops = [];
  for (let i = 0; i < 160; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await new Promise((r) => setTimeout(r, 40));
    const s = await call(p, ringInfo);
    if (s.none) { if (stops.length) break; continue; }
    if (s.again) break; // focus came back to an element already visited: one full cycle done
    stops.push(s);
  }
  const inW = stops.filter((s) => s.inWrap);
  R.focus = { stops: stops.length, insideWrapper: inW.length, pass: inW.filter((s) => s.pass).length, fail: inW.filter((s) => !s.pass).map((s) => ({ key: s.key, outline: s.outline, clippedBy: s.clippedBy, visible: s.visible })).slice(0, 8), outsideWrapper: stops.filter((s) => !s.inWrap).map((s) => s.key + ' ' + s.outline).slice(0, 6), viaCardRing: inW.filter((s) => s.pass && !(s.own && !s.clippedBy)).length };
  const ax = await axRows(p);
  R.h1 = { exposed: ax.filter((n) => n.role === 'heading' && n.level === 1 && !n.ignored).map((n) => n.name), inMarkup: await p.eval('document.querySelectorAll("h1").length') };
  R.network = p.stats; await p.close();

  // 2. reduced motion
  p = await open({ ...doc, inject: { mode: c.mode, css: min } }, { width: 1280, height: 900, media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  R.motionReduce = await call(p, motion); await p.close();

  // 3. 320 px reflow (mobile viewport)
  const PHONE = { width: 320, height: 800, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36' };
  p = await open({ ...doc, inject: { mode: c.mode, css: min } }, PHONE);
  R.reflow320 = await call(p, reflow, 320); await p.close();
  // same page without the template, to tell itch's own overflow from the template's
  p = await open({ ...doc, inject: { mode: c.mode, css: '' } }, PHONE);
  R.reflow320NoTemplate = await call(p, reflow, 320); await p.close();
  // desktop UA at 320 px (what a narrow desktop window or a non-UA-switching emulator shows)
  p = await open({ ...doc, inject: { mode: c.mode, css: min } }, { width: 320, height: 800, mobile: true });
  R.reflow320DesktopUA = await call(p, reflow, 320); await p.close();

  // 4. forced colours
  p = await open({ ...doc, inject: { mode: c.mode, css: min } }, { width: 1280, height: 900, media: [{ name: 'forced-colors', value: 'active' }] });
  R.forced = await call(p, forced); await p.close();
  console.log(name, JSON.stringify({ min: R.minChars, cssomEqual: R.cssomEqual, focus: [R.focus.pass, R.focus.insideWrapper], h1: R.h1.exposed, reduceRunning: R.motionReduce.running, reflow: R.reflow320.horizontalScroll }));
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'templates-' + (only.join('-') || 'all') + '.json'), JSON.stringify(results, null, 1));
