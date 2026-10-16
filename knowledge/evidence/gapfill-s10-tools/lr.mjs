// lr.mjs - "live render with injected CSS" for itch.io pages (Node 22, no dependencies).
//
// A headless Chrome (started separately with --remote-debugging-port=$CDP_PORT and a scratch
// --user-data-dir) loads the REAL page URL, so itch's own JavaScript runs exactly as for a
// logged-out visitor, while CDP's Fetch domain:
//   * serves the HTML document from a fresh logged-out GET (doc.live) or from a saved logged-out
//     copy (doc.snapshot), after putting the test CSS into style#custom_css (profile, project,
//     devlog) or at the end of style#jam_theme (jam);
//   * serves static.itch.io / img.itch.zone files from a write-once local mirror ($LR_MIRROR),
//     filling it with polite GETs (normal browser UA, >= 1.1 s apart, counted against a budget);
//   * lets Google Fonts through; blocks everything else (analytics, itch view-counter "hit" URLs,
//     XHR to itch.io, game iframes) and logs every decision to $LR_LOG.
// Hover GIFs (img.itch.zone/*/original/*.gif, the data-gif of .gif_overlay) are answered with a 1x1 placeholder unless LR_REAL_GIFS=1.
//
// Usage: import { open } from './lr.mjs';
//   const p = await open({ url, snapshot, live, inject: { mode: 'custom_css' | 'jam_theme' | 'keep', css } },
//                        { width, height, media, touch });
//   await p.eval('...'); await p.close();
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
globalThis.__zlib = zlib;

const PORT = process.env.CDP_PORT || 9611;
const MIRROR = process.env.LR_MIRROR;
const LOG = process.env.LR_LOG;
const RAW = process.env.LR_RAW;            // where live document fetches are saved (scratch only)
const BUDGET = Number(process.env.LR_ITCH_BUDGET || 120);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
if (!MIRROR) throw new Error('set LR_MIRROR to a scratch directory');
fs.mkdirSync(MIRROR, { recursive: true });

const COUNT_FILE = path.join(MIRROR, '_itch_network_requests.txt');
const log = (o) => { if (LOG) fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n'); };
const isItch = (h) => /(^|\.)itch\.(io|zone)$/.test(h);
const ASSET_HOSTS = new Set(['static.itch.io', 'img.itch.zone']);
const PASS_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const GIF1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

let last = 0;
let chain = Promise.resolve();
// Every network request to an itch host goes through here: GET only, one at a time, >= 1.1 s apart.
function politeFetch(url) {
  const run = async () => {
    const n = Number(fs.existsSync(COUNT_FILE) ? fs.readFileSync(COUNT_FILE, 'utf8') : 0);
    if (n >= BUDGET) throw new Error(`itch request budget (${BUDGET}) exhausted`);
    const wait = last + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    fs.writeFileSync(COUNT_FILE, String(n + 1));
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'manual' });
    const body = Buffer.from(await r.arrayBuffer());
    const headers = {};
    for (const k of ['content-type', 'access-control-allow-origin', 'last-modified', 'x-cache-status', 'location']) {
      const v = r.headers.get(k); if (v) headers[k] = v;
    }
    log({ kind: 'itch-network', url, status: r.status, bytes: body.length, n: n + 1 });
    return { status: r.status, headers, body };
  };
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}

function inMirror(url) { return fs.existsSync(path.join(MIRROR, crypto.createHash('sha1').update(url).digest('hex').slice(0, 20) + '.json')); }
function greyPng(w, h) {
  const zlib = globalThis.__zlib;
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0; // 8-bit greyscale
  const raw = Buffer.alloc((w + 1) * h, 0x88); for (let y = 0; y < h; y++) raw[y * (w + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function mirrored(url) {
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 20);
  const meta = path.join(MIRROR, key + '.json'), bin = path.join(MIRROR, key + '.bin');
  if (fs.existsSync(meta)) return { ...JSON.parse(fs.readFileSync(meta, 'utf8')), body: fs.readFileSync(bin), cached: true };
  const r = await politeFetch(url);
  if (r.status === 200) {
    fs.writeFileSync(bin, r.body);
    fs.writeFileSync(meta, JSON.stringify({ url, status: r.status, headers: r.headers, fetchedAt: new Date().toISOString() }));
  }
  return { ...r, cached: false };
}

export function injectCss(html, inject) {
  if (!inject || inject.mode === 'keep') return html;
  const css = inject.css || '';
  if (inject.mode === 'custom_css') {
    const re = /<style[^>]*id="custom_css"[^>]*>[\s\S]*?<\/style>/;
    const tag = `<style id="custom_css" type="text/css">${css}</style>`;
    return re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => tag + '</head>');
  }
  if (inject.mode === 'jam_theme') {
    const m = /(<style[^>]*id="jam_theme"[^>]*>)([\s\S]*?)(<\/style>)/.exec(html);
    if (!m) throw new Error('no style#jam_theme in document');
    return html.slice(0, m.index) + m[1] + m[2] + css + m[3] + html.slice(m.index + m[0].length);
  }
  throw new Error('unknown inject mode ' + inject.mode);
}

async function documentHtml(doc) {
  if (doc.snapshot) return fs.readFileSync(doc.snapshot, 'utf8');
  if (!doc.live) throw new Error('doc needs snapshot or live:true');
  if (doc._html) return doc._html; // one live GET per open() call, reused on reloads
  const r = await politeFetch(doc.url);
  const html = r.body.toString('utf8');
  if (r.status !== 200 || !/user_page|view_game_page|inner_column|view_jam_page|game_devlog_post_page/.test(html))
    throw new Error(`live document not usable: status ${r.status}, ${html.length} chars`);
  if (RAW) { fs.mkdirSync(RAW, { recursive: true }); fs.writeFileSync(path.join(RAW, 'live-' + new URL(doc.url).hostname + new URL(doc.url).pathname.replace(/\W+/g, '_') + '.html'), html); }
  doc._html = html; doc._xcache = r.headers['x-cache-status'];
  return html;
}

// One fresh logged-out GET of a page (counted, throttled), validated and saved to $LR_RAW; returns the file path,
// which later open() calls use as doc.snapshot so that every CSS variant re-renders the same live body.
export async function liveSnapshot(url, minGapMs = 7000) {
  if (last && Date.now() - last < minGapMs) await new Promise((r) => setTimeout(r, minGapMs - (Date.now() - last)));
  const r = await politeFetch(url);
  const html = r.body.toString('utf8');
  if (r.status !== 200 || !/user_page|view_game_page|view_jam_page|game_devlog_post_page/.test(html) || /Just a moment\.\.\./.test(html))
    throw new Error(`live document not usable: status ${r.status}, ${html.length} chars`);
  fs.mkdirSync(RAW, { recursive: true });
  const file = path.join(RAW, 'live-' + (new URL(url).hostname + new URL(url).pathname).replace(/\W+/g, '_') + '.html');
  fs.writeFileSync(file, html);
  log({ kind: 'live-snapshot', url, file, xcache: r.headers['x-cache-status'] || null, bytes: html.length });
  return file;
}

export async function open(doc, { width = 1280, height = 900, mobile = false, ua = null, media = [], touch = false, settle = 1000, idleMax = 90000 } = {}) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { r, j } = pending.get(m.id); pending.delete(m.id); m.error ? j(new Error(JSON.stringify(m.error))) : r(m.result); }
    else if (m.method) listeners.forEach((f) => f(m));
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const stats = { served: 0, mirrorHits: 0, network: 0, passed: 0, blocked: [], placeholders: 0 };
  let inflight = 0, lastActivity = Date.now();

  listeners.push(async (m) => {
    if (m.method !== 'Fetch.requestPaused') return;
    const { requestId, request, resourceType } = m.params;
    inflight++; lastActivity = Date.now();
    const u = new URL(request.url);
    try {
      if (request.method !== 'GET') { stats.blocked.push(request.method + ' ' + request.url); log({ kind: 'blocked-method', url: request.url, method: request.method }); await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); return; }
      if (resourceType === 'Document' && request.url.split('#')[0] === doc.url) {
        const html = injectCss(await documentHtml(doc), doc.inject);
        stats.served++;
        log({ kind: 'document', url: request.url, source: doc.snapshot ? 'snapshot' : 'live', bytes: html.length });
        await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }], body: Buffer.from(html).toString('base64') });
        return;
      }
      if (ASSET_HOSTS.has(u.hostname)) {
        if (u.hostname === 'img.itch.zone' && /\/original\/[^/]*\.gif$/i.test(u.pathname) && !process.env.LR_REAL_GIFS) {
          stats.placeholders++; log({ kind: 'gif-placeholder', url: request.url });
          await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/gif' }], body: GIF1x1.toString('base64') });
          return;
        }
        // LR_NEW_IMAGES=placeholder: an img.itch.zone file that is not in the mirror yet is answered with a
        // grey PNG of the size encoded in its URL (/315x250%23c/, /25x25%23/, /347x500/), so layout stays
        // faithful without another request to itch.
        if (u.hostname === 'img.itch.zone' && process.env.LR_NEW_IMAGES === 'placeholder' && !inMirror(request.url)) {
          const m = /\/(\d+)x(\d+)/.exec(u.pathname);
          stats.placeholders++; log({ kind: 'img-placeholder', url: request.url });
          await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/png' }, { name: 'access-control-allow-origin', value: '*' }], body: greyPng(m ? +m[1] : 315, m ? +m[2] : 250).toString('base64') });
          return;
        }
        const r = await mirrored(request.url);
        r.cached ? stats.mirrorHits++ : stats.network++;
        const hdrs = Object.entries(r.headers || {}).filter(([k]) => k !== 'location').map(([name, value]) => ({ name, value }));
        if (!hdrs.some((h) => h.name === 'access-control-allow-origin')) hdrs.push({ name: 'access-control-allow-origin', value: '*' });
        await send('Fetch.fulfillRequest', { requestId, responseCode: r.status, responseHeaders: hdrs, body: r.body.toString('base64') });
        return;
      }
      if (PASS_HOSTS.has(u.hostname)) { stats.passed++; log({ kind: 'pass', url: request.url }); await send('Fetch.continueRequest', { requestId }); return; }
      stats.blocked.push(request.url.slice(0, 160));
      log({ kind: 'blocked', url: request.url, resourceType, itch: isItch(u.hostname) });
      await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch (e) {
      log({ kind: 'error', url: request.url, error: String(e) });
      try { await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); } catch {}
    } finally { inflight--; lastActivity = Date.now(); }
  });

  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (ua) await send('Emulation.setUserAgentOverride', { userAgent: ua }); // page-side navigator.userAgent (itch's I.is_mobile() reads it)
  if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
  if (touch) { await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' }); }

  const waitLoad = async (navigate) => {
    const loaded = new Promise((r) => listeners.push((m) => { if (m.method === 'Page.loadEventFired') r(); }));
    await navigate();
    await Promise.race([loaded, new Promise((r) => setTimeout(r, idleMax))]);
    const t0 = Date.now(); // network idle: nothing paused for 600 ms (image fills of the mirror are throttled)
    while (Date.now() - t0 < idleMax) { if (inflight === 0 && Date.now() - lastActivity > 600) break; await new Promise((r) => setTimeout(r, 100)); }
    await new Promise((r) => setTimeout(r, settle)); // the "+1 s" after load
  };
  await waitLoad(() => send('Page.navigate', { url: doc.url }));

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 600));
    return res.result.value;
  };
  return {
    send, eval: evalJs, stats, doc,
    reload: () => waitLoad(() => send('Page.reload', { ignoreCache: true })),
    async idle(ms = 600) { const t0 = Date.now(); while (Date.now() - t0 < idleMax) { if (inflight === 0 && Date.now() - lastActivity > ms) break; await new Promise((r) => setTimeout(r, 100)); } },
    async close() { try { await send('Page.close'); } catch {} ws.close(); },
    async shot(file, clip) { const r = await send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
  };
}

export async function axRows(p) {
  await p.send('Accessibility.enable');
  const { nodes } = await p.send('Accessibility.getFullAXTree');
  return nodes.map((n) => ({ role: n.role?.value, name: n.name?.value, ignored: n.ignored, level: (n.properties || []).find((x) => x.name === 'level')?.value?.value, backendDOMNodeId: n.backendDOMNodeId }));
}
