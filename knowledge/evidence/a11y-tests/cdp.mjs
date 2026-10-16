// Minimal CDP helper for Node 22 (global WebSocket). Connects to a headless Chrome started with
// --remote-debugging-port=9333 and an isolated --user-data-dir. Usage:
//   import { openPage } from './cdp.mjs';
//   const p = await openPage(url, {width, height}); await p.eval('1+1'); await p.close();
const PORT = process.env.CDP_PORT || 9333;

export async function openPage(url, { width = 1280, height = 900, media = [], fontSize, touch = false, beforeLoad } = {}) {
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
  // Opt-in etiquette guard: CDP_BLOCK_ITCH=1 blocks every request to itch.io / itch.zone, so repeated test loads of a
  // harness (banner and thumbnail images, stylesheets you forgot to rewrite) never reach itch's servers.
  if (process.env.CDP_BLOCK_ITCH) { await send('Network.enable'); await send('Network.setBlockedURLs', { urls: ['*itch.zone*', '*itch.io*'] }); }
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('CSS.enable').catch(() => {});
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
  if (fontSize) await send('Page.setFontSizes', { fontSizes: { standard: fontSize, fixed: Math.round(fontSize * 13 / 16) } });
  if (touch) { await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' }); }
  if (beforeLoad) await beforeLoad(send);
  const loaded = new Promise((r) => listeners.push((m) => { if (m.method === 'Page.loadEventFired') r(); }));
  await send('Page.navigate', { url });
  await Promise.race([loaded, new Promise((r) => setTimeout(r, 15000))]);
  await new Promise((r) => setTimeout(r, 1500)); // fonts / imports settle
  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 500));
    return res.result.value;
  };
  return {
    send, eval: evalJs,
    async close() { try { await send('Page.close'); } catch {} ws.close(); },
    async shot(path, clip) {
      const r = await send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' });
      (await import('node:fs')).writeFileSync(path, Buffer.from(r.data, 'base64'));
    },
  };
}

// Flatten the full accessibility tree into readable rows.
export async function axRows(p) {
  await p.send('Accessibility.enable');
  const { nodes } = await p.send('Accessibility.getFullAXTree');
  return nodes.map((n) => ({
    role: n.role?.value, name: n.name?.value, ignored: n.ignored,
    ignoredReasons: (n.ignoredReasons || []).map((r) => r.name).join(','),
    backendDOMNodeId: n.backendDOMNodeId,
  }));
}
