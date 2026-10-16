// Drives an isolated headless Chrome (own --user-data-dir) over CDP and prints each test page's result.
// Usage: node cdp.mjs <chromePath> <profileDir> page1.html page2.html ... | bf
import { spawn } from 'node:child_process';

const [chromePath, profile, ...pages] = process.argv.slice(2);
const PORT = 9339;
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync',
  '--disable-background-networking', '--window-size=1200,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch {}
  await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const listeners = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else listeners.forEach((l) => l(m));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const waitEvent = (name, timeout = 20000) => new Promise((resolve) => {
  const t = setTimeout(() => resolve(null), timeout);
  const l = (m) => { if (m.method === name) { clearTimeout(t); listeners.splice(listeners.indexOf(l), 1); resolve(m.params); } };
  listeners.push(l);
});
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result;

await send('Page.enable'); await send('Runtime.enable');
const A = 'http://localhost:8701/pages/';
for (const p of pages) {
  if (p === 'reload') { // verifier addition: navigate, reload, navigate again; count n=rl requests in log-8702.jsonl
    let load = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url: A + 'rl1.html' }); await load; await sleep(300);
    load = waitEvent('Page.loadEventFired'); await send('Page.reload', {}); await load; await sleep(300);
    load = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url: A + 'rl1.html' }); await load; await sleep(300);
    console.log(JSON.stringify({ page: 'reload', done: true }));
    continue;
  }
  if (p === 'bf') {
    const bfEvents = [];
    listeners.push((m) => { if (m.method === 'Page.backForwardCacheNotUsed') bfEvents.push(m.params); });
    let load = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url: A + 'bf1.html' }); await load; await sleep(500);
    const first = await evaluate('getComputedStyle(document.documentElement).getPropertyValue("--bf")');
    load = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url: A + 'bf2.html' }); await load; await sleep(500);
    const hist = (await send('Page.getNavigationHistory')).result;
    const back = waitEvent('Page.frameNavigated', 8000);
    await send('Page.navigateToHistoryEntry', { entryId: hist.entries[hist.currentIndex - 1].id });
    await back; await sleep(1500);
    const after = await evaluate('JSON.stringify({bf:getComputedStyle(document.documentElement).getPropertyValue("--bf"),pageshows:window.__pageshows,nav:performance.getEntriesByType("navigation")[0].type})');
    console.log(JSON.stringify({ page: 'bf', first: first.result?.value, afterBack: after.result?.value, notUsed: bfEvents }, null, 0));
    continue;
  }
  const t0 = Date.now();
  const load = waitEvent('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: p.startsWith('http') ? p : A + p }); // verifier-2: absolute URLs allowed (e.g. http://127.0.0.2:8701/pages/cookie2.html)
  const loaded = await load;
  const r = await evaluate('window.__result()');
  console.log(JSON.stringify({ page: p, loadMsWall: Date.now() - t0, loaded: !!loaded, result: r.value ?? r }, null, 0));
}
ws.close(); chrome.kill();
process.exit(0);
