// Headless Chrome runner (DevTools Protocol, Node >= 22 global WebSocket).
// Usage: node cdp.mjs <chrome.exe> <profileDir> <specFile.json>
// spec: { url, width?, height?, mobile?, reducedMotion?, waitMs?, eval?: "<js expr>", ax?: ["#sel", ...], screenshot?: "<out.png>" }
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [chromePath, profileDir, specFile] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specFile, 'utf8'));
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--allow-file-access-from-files',
  `--user-data-dir=${profileDir}`, `--remote-debugging-port=${port}`, 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}${path}`); return await r.json(); } catch { await sleep(200); }
  }
  throw new Error('DevTools endpoint not reachable');
}
try {
  const version = await json('/json/version');
  const page = (await json('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: spec.width || 1200, height: spec.height || 800, deviceScaleFactor: 1, mobile: !!spec.mobile });
  if (spec.reducedMotion) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: spec.url });
  for (let i = 0; i < 80 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(spec.waitMs ?? 300);
  const out = { browser: version.Browser };
  if (spec.eval) {
    const r = await send('Runtime.evaluate', { expression: spec.eval, returnByValue: true, awaitPromise: true });
    out.eval = r.result?.result?.value ?? r.result?.exceptionDetails ?? r;
  }
  if (spec.ax) {
    await send('DOM.enable'); await send('Accessibility.enable');
    const doc = await send('DOM.getDocument', { depth: -1 });
    out.ax = [];
    for (const sel of spec.ax) {
      const q = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: sel });
      const ax = await send('Accessibility.getPartialAXTree', { nodeId: q.result.nodeId, fetchRelatives: false });
      const node = (ax.result?.nodes || [])[0] || {};
      out.ax.push({ sel, role: node.role?.value, name: node.name?.value, ignored: node.ignored });
    }
  }
  if (spec.screenshot) {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(spec.screenshot, Buffer.from(s.result.data, 'base64'));
    out.screenshot = spec.screenshot;
  }
  console.log(JSON.stringify(out, null, 1));
  ws.close();
} finally {
  chrome.kill();
}
