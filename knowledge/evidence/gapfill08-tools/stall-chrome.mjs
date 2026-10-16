// Stall lab driver for Chrome (gapfill-08, 2026-10-14).
// usage: node stall-chrome.mjs <chromePath> <profilesDir> <capMs> <pageUrl> [<pageUrl> ...]
// One isolated headless Chrome per page (own --user-data-dir and port, run in parallel, so no shared socket pool).
// Reports per page: FCP (paint timing), when the end-of-body inline script ran, load event, and the @import
// request's fate from the Network domain (failed + errorText / finished / still pending at cap), all in ms
// relative to Page.navigate.
import { spawn } from 'node:child_process';
import path from 'node:path';

const [chromePath, profilesDir, capMsS, ...pages] = process.argv.slice(2);
const capMs = Number(capMsS);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(url, idx) {
  const port = 9400 + idx;
  const name = url.split('/').pop();
  const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.join(profilesDir, 'p' + idx)}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-sync', '--disable-background-networking', '--window-size=1200,900', 'about:blank'],
  { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 100; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch {}
    await sleep(200);
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const net = {}; let t0 = 0; let loadAt = null; let version = '';
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    const now = Date.now() - t0;
    if (m.method === 'Network.requestWillBeSent' && m.params.type === 'Stylesheet') net[m.params.requestId] = { url: m.params.request.url, sent: now };
    if (m.method === 'Network.responseReceived' && net[m.params.requestId]) net[m.params.requestId].headers = now;
    if (m.method === 'Network.loadingFinished' && net[m.params.requestId]) net[m.params.requestId].finished = now;
    if (m.method === 'Network.loadingFailed' && net[m.params.requestId]) Object.assign(net[m.params.requestId], { failed: now, error: m.params.errorText });
    if (m.method === 'Page.loadEventFired') loadAt = now;
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  version = (await send('Browser.getVersion')).result?.product || '';
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  t0 = Date.now();
  await send('Page.navigate', { url });
  let state = {};
  while (Date.now() - t0 < capMs) {
    await sleep(250);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression:
      `JSON.stringify({fcp:(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime??null,` +
      `end:window.__endScript??null,rs:document.readyState,` +
      `color:document.querySelector('#wrapper p')?getComputedStyle(document.querySelector('#wrapper p')).color:null})` });
    try { state = JSON.parse(r.result.result.value); } catch {}
    const imp = Object.values(net)[0];
    const settled = imp && (imp.failed != null || imp.finished != null);
    if (state.fcp != null && (settled || !imp) && loadAt != null) break;
  }
  const imp = Object.values(net)[0] || null;
  const out = { page: name, browser: version, capMs, fcpMs: state.fcp != null ? Math.round(state.fcp) : `>${capMs}`,
    endScriptMs: state.end != null ? Math.round(state.end) : `>${capMs}`, loadMs: loadAt ?? `>${capMs}`,
    readyState: state.rs, pColor: state.color, import: imp };
  ws.close(); chrome.kill();
  return out;
}

const results = await Promise.all(pages.map((u, i) => runOne(u, i)));
for (const r of results) console.log(JSON.stringify(r));
process.exit(0);
