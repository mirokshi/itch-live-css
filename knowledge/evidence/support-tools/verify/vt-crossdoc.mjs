// Verifier test: does a cross-document view transition start between two same-origin pages,
// depending on where @view-transition is written? Serves pages from an in-process HTTP server on 127.0.0.1,
// drives headless Chrome over CDP, navigates A -> B by setting location.href, and reads the
// `pagereveal` event's viewTransition on page B.
// Usage: node vt-crossdoc.mjs "<chrome.exe>" "<temp profile dir>"
import { spawn } from 'node:child_process';
import http from 'node:http';

const [chromePath, profileDir] = process.argv.slice(2);
const variants = {
  none: { a: '', b: '' },
  toplevel: { a: '@view-transition{navigation:auto}', b: '@view-transition{navigation:auto}' },
  media: { a: '@media (prefers-reduced-motion: no-preference){@view-transition{navigation:auto}}', b: '@media (prefers-reduced-motion: no-preference){@view-transition{navigation:auto}}' },
  nestedInStyleRule: { a: '#wrapper{color:black;@view-transition{navigation:auto}}', b: '#wrapper{color:black;@view-transition{navigation:auto}}' },
  onlyOld: { a: '@view-transition{navigation:auto}', b: '' },
  onlyNew: { a: '', b: '@view-transition{navigation:auto}' },
};
const page = (css, which) => `<!doctype html><html><head><meta charset="utf-8"><title>${which}</title>
<script>window.__vt='no-pagereveal';addEventListener('pagereveal',e=>{window.__vt=e.viewTransition?'transition':'none'});
window.__rm=matchMedia('(prefers-reduced-motion: reduce)').matches;</script>
<style>${css}</style></head><body><div id="wrapper"><h1>${which}</h1><a id="go" href="b">b</a></div></body></html>`;
const server = http.createServer((req, res) => {
  const [, v, p] = req.url.split('/');
  const conf = variants[v];
  if (!conf) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page(p === 'b' ? conf.b : conf.a, p === 'b' ? 'B' : 'A'));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const httpPort = server.address().port;

const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', `--user-data-dir=${profileDir}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 60; i++) { try { return await (await fetch(`http://127.0.0.1:${port}${path}`)).json(); } catch { await sleep(200); } }
  throw new Error('no devtools');
}
try {
  const version = await json('/json/version');
  const target = (await json('/json/list')).find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
  await send('Page.enable'); await send('Runtime.enable');
  const out = { browser: version.Browser, results: {} };
  for (const v of Object.keys(variants)) {
    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/${v}/a` });
    await sleep(800);
    const reducedMotion = await evalJs('window.__rm');
    await evalJs(`document.getElementById('go').click()`);
    await sleep(1200);
    out.results[v] = { title: await evalJs('document.title'), pagereveal: await evalJs('window.__vt'), reducedMotion };
  }
  console.log(JSON.stringify(out, null, 1));
  ws.close();
} finally { chrome.kill(); server.close(); }
