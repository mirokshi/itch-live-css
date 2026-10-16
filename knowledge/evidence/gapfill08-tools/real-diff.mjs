// Real-page computed-style diff (gapfill-08, 2026-10-14).
// usage: node real-diff.mjs <chromePath> <profileDir> <baseUrl> <outJson> <page> [<page> ...]
//   pages are names like profile-none (the first page of each family "<x>-none" is the baseline)
// Chrome runs headless with every non-127.0.0.1 hostname mapped to NOTFOUND, so only local copies load.
// For each page: navigate, wait for load + 2.5 s (itch's own scripts run), collect computed styles of every element.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [chromePath, profile, base, outJson, ...pages] = process.argv.slice(2);
const PORT = 9466;
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--disable-background-networking',
  '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = [];
for (let i = 0; i < 100; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const listeners = [];
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach((l) => l(m)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const waitEvent = (name, timeout = 30000) => new Promise((resolve) => { const t = setTimeout(() => resolve(null), timeout); const l = (m) => { if (m.method === name) { clearTimeout(t); listeners.splice(listeners.indexOf(l), 1); resolve(m.params); } }; listeners.push(l); });
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const version = (await send('Browser.getVersion')).result.product;

const PROPS = ['display', 'visibility', 'position', 'box-sizing', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-family', 'font-size', 'font-weight', 'line-height',
  'color', 'background-color', 'border-top-width', 'border-top-style', 'border-top-color', 'border-top-left-radius', 'text-align',
  'text-decoration-line', 'width', 'height', 'opacity', 'transform', 'filter', 'box-shadow', 'animation-name', 'animation-duration',
  'transition-duration', 'cursor', 'vertical-align', 'list-style-type', 'scroll-behavior', '--tw-rotate', '--bs-body-bg',
  '--bs-spinner-animation-speed', '--custom-spacing', '--custom-color-red-500'];
const COLLECT = `(() => {
  const P = ${JSON.stringify(PROPS)};
  const W = document.getElementById('wrapper');
  const bio = document.querySelector('.user_profile, .formatted_description');
  const lab = [...document.querySelectorAll('.custom-bs, .custom-tw')];
  const bounce = document.getElementById('lab_bounce');
  let bounceAnim = null;
  if (bounce) { bounce.classList.remove('animate_bounce'); void bounce.offsetWidth; bounce.classList.add('animate_bounce'); const a = bounce.getAnimations()[0]; if (a) { a.pause(); a.currentTime = (a.effect.getTiming().duration || 500) * 0.25;
    bounceAnim = { name: a.animationName, tfAt25pct: getComputedStyle(bounce).transform, opAt25pct: getComputedStyle(bounce).opacity }; } }
  const els = [...document.querySelectorAll('*')];
  return JSON.stringify({ jsRan: typeof window.I !== 'undefined', bounceAnim,
    sheets: [...document.styleSheets].map(s => { try { return (s.href || ('inline#' + (s.ownerNode.id || ''))).split('/').pop() + ':' + s.cssRules.length; } catch (e) { return 'x'; } }),
    els: els.map((e) => { const cs = getComputedStyle(e);
      const zone = (W && (W === e || W.contains(e))) ? (lab.some(l => l.contains(e)) ? 'lab' : (bio && bio.contains(e) ? 'bio-own' : 'wrapper-itch')) : 'outside';
      const cls = typeof e.className === 'string' ? e.className : '';
      return { t: e.tagName.toLowerCase(), c: cls.slice(0, 80), id: e.id || '', z: zone, v: P.map(p => cs.getPropertyValue(p).trim()) }; }) });
})()`;

const results = {};
for (const p of pages) {
  const [name, rm] = p.split('@');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: rm === 'rm' ? 'reduce' : 'no-preference' }] });
  const load = waitEvent('Page.loadEventFired');
  await send('Page.navigate', { url: `${base}/pages/${name}.html` });
  await load; await sleep(2500);
  const r = await send('Runtime.evaluate', { expression: COLLECT, returnByValue: true });
  results[p] = JSON.parse(r.result.result.value);
  console.error(p, 'elements', results[p].els.length, 'jsRan', results[p].jsRan);
}
ws.close(); chrome.kill();

// diff against "<family>-none"
const ITCH_CLS = ['visible', 'invisible', 'active', 'disabled', 'small', 'icon-link', 'text-center'];
const summary = { browser: version, props: PROPS, pages: {} };
for (const p of pages) {
  const fam = p.split('-')[0]; const rm = p.includes('@rm') ? '@rm' : '';
  const b = results[`${fam}-none${rm}`]; const v = results[p];
  if (!b || b === v) { summary.pages[p] = { baseline: true, elements: v.els.length, jsRan: v.jsRan, bounceAnim: v.bounceAnim, sheets: v.sheets }; continue; }
  const byZone = {}; const propCount = {}; const examples = {}; const itchCls = []; const lab = {};
  const n = Math.min(b.els.length, v.els.length);
  for (let i = 0; i < n; i++) {
    const eb = b.els[i], ev = v.els[i];
    const changed = PROPS.map((pr, k) => [pr, eb.v[k], ev.v[k]]).filter(([, x, y]) => x !== y);
    if (ev.c.includes('custom-lab-')) lab[ev.c.match(/custom-lab-[\w]+/)[0]] = Object.fromEntries(PROPS.map((pr, k) => [pr, ev.v[k]]).filter(([pr]) => ['display', 'transform', 'width', 'box-shadow', 'filter', 'color', 'animation-name', 'animation-duration', 'transition-duration', 'background-color', 'padding-left', 'font-size', 'margin-top', '--bs-spinner-animation-speed', 'text-align'].includes(pr)));
    if (!changed.length) continue;
    byZone[ev.z] = (byZone[ev.z] || 0) + 1;
    for (const [pr] of changed) { const k = ev.z + ':' + pr; propCount[k] = (propCount[k] || 0) + 1; }
    (examples[ev.z] ||= []).length < 6 && examples[ev.z].push(`${ev.t}${ev.id ? '#' + ev.id : ''}${ev.c ? '.' + ev.c.trim().split(/\s+/).join('.') : ''} :: ` + changed.slice(0, 4).map(([pr, x, y]) => `${pr} ${x} -> ${y}`).join(' | '));
    const hit = ev.c.split(/\s+/).filter((c) => ITCH_CLS.includes(c));
    if (hit.length && ev.z !== 'lab') itchCls.push(`${ev.t}.${ev.c.trim().split(/\s+/).join('.')} [${ev.z}] :: ` + changed.slice(0, 3).map(([pr, x, y]) => `${pr} ${x} -> ${y}`).join(' | '));
  }
  const itchClsPresent = v.els.filter((e) => e.z !== 'lab' && e.c.split(/\s+/).some((c) => ITCH_CLS.includes(c))).map((e) => `${e.t}.${e.c.trim().split(/\s+/).join('.')} [${e.z}]`);
  summary.pages[p] = { elements: v.els.length, sameCount: b.els.length === v.els.length, jsRan: v.jsRan, bounceAnim: v.bounceAnim,
    changedByZone: byZone, topProps: Object.entries(propCount).sort((a, c) => c[1] - a[1]).slice(0, 14), examples,
    itchClassElementsChanged: itchCls.slice(0, 12), itchClassElementsPresent: itchClsPresent.slice(0, 20), lab, sheets: v.sheets };
}
fs.writeFileSync(outJson, JSON.stringify(summary, null, 1));
console.log('wrote', outJson);
process.exit(0);
