// Gap-fill 07 (2026-10-14): render a LIVE itch page with itch's own JS running, then swap test rules
// into the custom-CSS position and read the grids at several widths.
// usage: node livegrid.mjs <url> <profile|jam> <outPrefix> <userDataDir>
//   env: VARIANTS=<json file {name: css}>  WIDTHS=1400,700,420
//   outPrefix MUST be a scratch path: it receives the raw served itch HTML (third-party content, never commit it).
// One document GET per run; images/analytics blocked; static.itch.io CSS/JS loads normally.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [url, kind, outPrefix, udd] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
const port = 9500 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--disable-background-networking', '--disable-component-update',
  `--user-data-dir=${udd}`, `--remote-debugging-port=${port}`, '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function j(path) { for (let i = 0; i < 60; i++) { try { return await (await fetch(`http://127.0.0.1:${port}${path}`)).json(); } catch { await sleep(200); } } throw new Error('no devtools'); }

const log = [];
const out = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
try {
  const ver = await j('/json/version');
  const page = (await j('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map(); const handlers = [];
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { r, k } = pend.get(m.id); pend.delete(m.id); m.error ? k(new Error(JSON.stringify(m.error))) : r(m.result); }
    else if (m.method) handlers.forEach((h) => h(m)); });
  const send = (method, params = {}) => new Promise((r, k) => { const i = ++id; pend.set(i, { r, k }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) throw new Error(JSON.stringify(x.exceptionDetails).slice(0, 400)); return x.result.value; };

  out('browser', ver.Browser, 'url', url, 'kind', kind, 'date', new Date().toISOString());
  const reqs = [];
  handlers.push((m) => { if (m.method === 'Network.requestWillBeSent') reqs.push(m.params.request.url); });
  await send('Network.enable');
  await send('Network.setUserAgentOverride', { userAgent: UA });
  await send('Network.setBlockedURLs', { urls: ['*img.itch.zone*', '*.png*', '*.jpg*', '*.gif*', '*.webp*', '*google-analytics*', '*googletagmanager*', '*doubleclick*', '*/embed/*'] });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: url + '*', resourceType: 'Document', requestStage: 'Response' }] });
  let origCustom = null;
  handlers.push(async (m) => {
    if (m.method !== 'Fetch.requestPaused') return;
    const p = m.params;
    const body = await send('Fetch.getResponseBody', { requestId: p.requestId });
    let html = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
    fs.writeFileSync(outPrefix + '-served.html', html); // raw copy: scratchpad only
    // empty the creator's custom CSS (if any), keep its position; else add an empty one at the end of <head>
    const re = /(<style[^>]*id="custom_css"[^>]*>)([\s\S]*?)(<\/style>)/;
    if (re.test(html)) { origCustom = html.match(re)[2].length; html = html.replace(re, '$1$3'); }
    else if (kind === 'profile') { html = html.replace('</head>', '<style type="text/css" id="custom_css"></style></head>'); origCustom = -1; }
    const headers = (p.responseHeaders || []).filter((h) => !/^content-(length|encoding)$/i.test(h.name));
    await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: headers, body: Buffer.from(html, 'utf8').toString('base64') });
  });
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
  const loaded = new Promise((r) => handlers.push((m) => { if (m.method === 'Page.loadEventFired') r(); }));
  await send('Page.navigate', { url });
  await Promise.race([loaded, sleep(20000)]);
  await sleep(2500);
  out('custom_css original length', origCustom);

  // where test rules go
  const setRules = kind === 'jam'
    ? (css) => `(()=>{const t=document.getElementById('jam_theme');if(!t.dataset.orig)t.dataset.orig=t.textContent;t.textContent=t.dataset.orig+${JSON.stringify(css)};return t.textContent.length})()`
    : (css) => `(()=>{const t=document.getElementById('custom_css');t.textContent=${JSON.stringify(css)};return t.textContent.length})()`;

  const EXTRA = process.env.VARIANTS ? JSON.parse(fs.readFileSync(process.env.VARIANTS,'utf8')) : null;
  const variants = EXTRA ? EXTRA : kind === 'jam' ? {
    V0_none: '',
    V1_wrapper_gapvar: '#wrapper{--itchio_grid_gap:40px}',
    V4_browse_columngap: '#wrapper .browse_game_grid{column-gap:40px}',
    V9_widget_gapvar: '#wrapper .game_grid_widget{--itchio_grid_gap:40px}',
  } : {
    V0_none: '',
    V1_wrapper_gapvar: '#wrapper{--itchio_grid_gap:40px}',
    V2_usergrid_gapvar: '#wrapper .user_game_grid{--itchio_grid_gap:40px}',
    V7_usergrid_columngap: '#wrapper .user_game_grid{column-gap:40px}',
    V3_modegrid_cols3: '#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(3,1fr)}',
    V8_unguarded_cols3: '#wrapper .user_game_grid{grid-template-columns:repeat(3,1fr)}',
    V5_unguarded_autofill: '#wrapper .user_game_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}#wrapper .user_game_grid .game_cell{width:auto}',
    V6_guarded_autofill: '#wrapper .mode_grid .user_game_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}#wrapper .mode_grid .user_game_grid .game_cell{width:auto}',
  };

  const read = `(()=>{
    const r={mode:(document.querySelector('.user_page')||{}).className||document.body.className.slice(0,80), vw:document.documentElement.clientWidth};
    r.sizers=[...document.querySelectorAll('style[itchio-grid-sizer]')].map(s=>s.textContent.replace(/\\s+/g,' ').trim());
    r.styleOrder=[...document.head.querySelectorAll('style,link[rel=stylesheet]')].map(s=>s.id?('#'+s.id):(s.hasAttribute('itchio-grid-sizer')?'sizer':(s.tagName==='LINK'?'link':'style'))).join(' > ');
    r.grids=[...document.querySelectorAll('.game_grid_widget')].slice(0,6).map(g=>{const cs=getComputedStyle(g);
      const cells=[...g.querySelectorAll(':scope > .game_cell')];const first=cells[0]?cells[0].getBoundingClientRect():null;
      const top=first?first.top:0;const row1=cells.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2);
      return {cls:g.className.replace(/\\s+/g,'.'), id:g.id||'', display:cs.display, cols:cs.gridTemplateColumns, colGap:cs.columnGap, rowGap:cs.rowGap,
        gapVar:cs.getPropertyValue('--itchio_grid_gap').trim(), w:Math.round(g.getBoundingClientRect().width), overflowX:cs.overflowX,
        sw:g.scrollWidth, cw:g.clientWidth, nCells:cells.length, row1:row1.length, cellW:row1.slice(0,3).map(c=>Math.round(c.getBoundingClientRect().width))}});
    return r})()`;

  for (const width of (process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [1400, 700, 420])) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await sleep(1200);
    for (const [name, css] of Object.entries(variants)) {
      await ev(setRules(css));
      await ev(`window.dispatchEvent(new Event('resize'))`);
      await sleep(700);
      const r = await ev(read);
      out(`W${width} ${name} ` + JSON.stringify(r));
    }
  }
  const itch = reqs.filter((u) => /itch\.(io|zone)/.test(u));
  out('requests total', reqs.length, 'itch-host', itch.length);
  itch.forEach((u) => out('  req', u.slice(0, 140)));
  ws.close();
} catch (e) { out('ERROR', e.stack || e); }
finally { fs.writeFileSync(outPrefix + '-results.txt', log.join('\n') + '\n'); chrome.kill(); }
