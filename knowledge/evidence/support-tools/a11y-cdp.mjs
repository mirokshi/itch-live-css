// Reads the accessibility tree of support-a11y.html in headless Chrome via the DevTools Protocol.
// Usage: node a11y-cdp.mjs "<path to chrome.exe>" "<file:/// url of support-a11y.html>" "<temp profile dir>"
// Needs Node >= 22 (global WebSocket). Prints the computed accessible name of every #t-* element.
import { spawn } from 'node:child_process';

const [chromePath, pageUrl, profileDir] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', `--user-data-dir=${profileDir}`,
  `--remote-debugging-port=${port}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function json(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}${path}`, { method }); return await r.json(); } catch { await sleep(200); }
  }
  throw new Error('DevTools endpoint not reachable');
}

try {
  const version = await json('/json/version');
  const targets = await json('/json/list');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable');
  await send('Page.navigate', { url: pageUrl });
  for (let i = 0; i < 50 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await send('DOM.enable');
  await send('Accessibility.enable');
  const doc = await send('DOM.getDocument', { depth: -1 });
  const out = { browser: version.Browser, results: [] };
  const ids = ['t-plain', 't-alt-empty', 't-alt-text', 't-fallback', 't-transparent', 't-vis-hidden', 't-disp-none', 't-roller'];
  for (const elId of ids) {
    const q = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '#' + elId });
    const ax = await send('Accessibility.getPartialAXTree', { nodeId: q.result.nodeId, fetchRelatives: false });
    const node = (ax.result?.nodes || [])[0] || {};
    out.results.push({ id: elId, role: node.role?.value, name: node.name?.value, ignored: node.ignored });
  }
  console.log(JSON.stringify(out, null, 1));
  ws.close();
} finally {
  chrome.kill();
}
