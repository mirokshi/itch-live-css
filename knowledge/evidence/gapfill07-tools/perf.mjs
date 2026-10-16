// Gap-fill 07 (2026-10-14): per-effect rendering cost of a decorated profile, Moto-G-class emulation
// (412x823, DPR 1.75, mobile, CPU throttled 4x), headless Chrome (GPU-enabled run on port 9490 is the reference;
// a --disable-gpu instance gives software-compositing numbers).
// Harness: a local copy of a real profile export + its custom CSS (main.css + one saved copy of the per-visit sheet),
// served by `python -m http.server <port>` from the harness root. itch hosts are blocked.
// Start Chrome (reference, GPU compositing):  chrome --headless=new --remote-debugging-port=9490 --user-data-dir=<scratch> about:blank
//   (software compositing: add --disable-gpu and use another port, e.g. 9489; its touch scroll gesture didn't scroll)
// Run:  CDP_PORT=9490 SCEN=idle-top,scroll node perf.mjs http://127.0.0.1:<port>/preview/index.html [reps]
//   env: ONLY=<config-id prefixes, e.g. E1,F2>  CPU=<throttle rate, default 4>  SCEN=idle-top,idle-cards,scroll  DEBUG=1
// Each effect is switched off by CSS written into style#perf_toggle (after style#custom_css).
const PORT = process.env.CDP_PORT || 9489;
const [url, repsArg] = process.argv.slice(2);
const REPS = +(repsArg || 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALL = '#wrapper,#wrapper *,#wrapper *::before,#wrapper *::after,#wrapper::before,#wrapper::after';
const configs = {
  'E0 no custom CSS': null,
  'E1 everything on': '',
  'E2 no backdrop-filter': '#wrapper .game_cell{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
  'E3 no star layers': '#wrapper::before,#wrapper::after,#wrapper .user_page::before{display:none!important}',
  'E4 star layers static': '#wrapper::before,#wrapper::after,#wrapper .user_page::before{animation:none!important}',
  'E5 no title wave': '#wrapper .custom-title span{animation:none!important}',
  'E6 no breathing weight': '#wrapper .custom-title{animation:none!important}',
  'E7 no greeting roller': '#wrapper .custom-hello::before{animation:none!important}',
  'E8 all animations off': ALL + '{animation:none!important}',
  'E9 only breathing weight': '#wrapper *:not(.custom-title),#wrapper *::before,#wrapper *::after,#wrapper::before,#wrapper::after{animation:none!important}',
  'E10 only title wave': '#wrapper .custom-title,#wrapper *::before,#wrapper *::after,#wrapper::before,#wrapper::after{animation:none!important}',
  'E11 only star twinkle': '#wrapper .custom-title,#wrapper .custom-title span,#wrapper .custom-hello::before{animation:none!important}',
  // breath custom property still animating on the h1, but the spans no longer turn it into font-weight
  'E12 breath running, weight fixed': '#wrapper .custom-title span{font-weight:600!important}',
  // the same three effects measured again with the breathing weight off, so it does not saturate the main thread
  'F1 no breath': '#wrapper .custom-title{animation:none!important}',
  'F2 no breath, no backdrop-filter': '#wrapper .custom-title{animation:none!important}#wrapper .game_cell{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
  'F3 no breath, no star layers': '#wrapper .custom-title{animation:none!important}#wrapper::before,#wrapper::after,#wrapper .user_page::before{display:none!important}',
  'F4 no breath, no backdrop, no stars': '#wrapper .custom-title{animation:none!important}#wrapper .game_cell{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}#wrapper::before,#wrapper::after,#wrapper .user_page::before{display:none!important}',
};
// optional filters: ONLY=<comma-separated config-name prefixes>, CPU=<throttling rate> (default 4), SCEN=<comma list>
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
if (ONLY) for (const k of Object.keys(configs)) if (!ONLY.some((o) => k.startsWith(o + ' '))) delete configs[k];
const CPU = +(process.env.CPU || 4);
const SCENS = process.env.SCEN ? process.env.SCEN.split(',') : ['idle-top', 'idle-cards', 'scroll'];
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'cc', 'viz'];
const NAMES = { UpdateLayoutTree: 'style', Layout: 'layout', PrePaint: 'prepaint', Paint: 'paint', Layerize: 'layerize', RasterTask: 'raster', Commit: 'commit' };

async function open() {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const hs = [];
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { r, j } = pend.get(m.id); pend.delete(m.id); m.error ? j(new Error(JSON.stringify(m.error))) : r(m.result); }
    else if (m.method) hs.forEach((h) => h(m)); };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const x = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (x.exceptionDetails) throw new Error(JSON.stringify(x.exceptionDetails).slice(0, 300)); return x.result.value; };
  return { ws, send, ev, hs, close: async () => { try { await send('Page.close'); } catch {} ws.close(); } };
}

const rows = [];
for (let rep = 0; rep < REPS; rep++) for (const [name, css] of Object.entries(configs)) for (const scenario of SCENS) {
  const p = await open();
  await p.send('Network.enable');
  await p.send('Network.setBlockedURLs', { urls: ['*itch.zone*', '*itch.io*'] });
  await p.send('Page.enable'); await p.send('Runtime.enable');
  await p.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
  const loaded = new Promise((r) => p.hs.push((m) => { if (m.method === 'Page.loadEventFired') r(); }));
  await p.send('Page.navigate', { url });
  await Promise.race([loaded, sleep(15000)]);
  await p.ev('document.fonts.ready.then(()=>1)');
  if (css === null) await p.ev(`document.getElementById('custom_css').textContent='';1`);
  else await p.ev(`document.getElementById('perf_toggle').textContent=${JSON.stringify(css)};1`);
  if (scenario === 'idle-cards') await p.ev(`(document.querySelector('.game_cell')||document.body).scrollIntoView();1`);
  await p.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await sleep(1500);
  const events = []; let done;
  const traceDone = new Promise((r) => { done = r; });
  p.hs.push((m) => { if (m.method === 'Tracing.dataCollected') events.push(...m.params.value); if (m.method === 'Tracing.tracingComplete') done(); });
  await p.send('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordAsMuchAsPossible' }, transferMode: 'ReportEvents' });
  await p.ev(`(()=>{window.__f=[];window.__loaf=0;const t0=performance.now();
    try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.duration>50)window.__loaf++}).observe({type:'long-animation-frame'})}catch(e){}
    const tick=t=>{window.__f.push(t);if(t-t0<3000)requestAnimationFrame(tick)};requestAnimationFrame(tick);return 1})()`);
  const y0 = await p.ev('scrollY');
  if (scenario === 'scroll') p.send('Input.synthesizeScrollGesture', { x: 200, y: 600, yDistance: -1500, speed: 600, gestureSourceType: 'mouse' }).catch(() => {});
  await sleep(3200);
  const raf = await p.ev(`(()=>{const f=window.__f;let mx=0;for(let i=1;i<f.length;i++)mx=Math.max(mx,f[i]-f[i-1]);
    return {fps:+((f.length-1)/((f[f.length-1]-f[0])/1000)).toFixed(1),maxGapMs:Math.round(mx),longFrames:window.__loaf,
      running:document.getAnimations().filter(a=>a.playState==='running').length}})()`);
  raf.scrolled = Math.round((await p.ev('scrollY')) - y0);
  await p.send('Tracing.end');
  await Promise.race([traceDone, sleep(20000)]);
  const sums = {};
  for (const e of events) if (e.ph === 'X' && NAMES[e.name]) sums[NAMES[e.name]] = (sums[NAMES[e.name]] || 0) + (e.dur || 0) / 1000;
  // compositor / display work (backdrop-filter is applied there, not in main-thread paint)
  for (const e of events) if (e.ph === 'X' && /^(Display::DrawAndSwap|DirectRenderer::DrawFrame|SkiaOutputSurfaceImplOnGpu::SwapBuffers|SoftwareRenderer::.*|Graphics\.Pipeline\.DrawAndSwap)$/.test(e.name)) sums.display = (sums.display || 0) + (e.dur || 0) / 1000;
  for (const e of events) if (e.ph === 'X' && e.name === 'SkiaOutputSurfaceImplOnGpu::FinishPaintRenderPass') sums.gpuPass = (sums.gpuPass || 0) + (e.dur || 0) / 1000;
  sums.drawAndSwapCount = events.filter((e) => e.name === 'Display::DrawAndSwap').length * 3.2;
  for (const k of Object.keys(sums)) sums[k] = +(sums[k] / 3.2).toFixed(1); // per second of wall time (ms, or count)
  if (process.env.DEBUG) { const t = {}; for (const e of events) if (e.ph === 'X') t[e.name] = (t[e.name] || 0) + (e.dur || 0) / 1000;
    console.log(Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(' | ')); }
  const row = { rep, cpu: CPU, name, scenario, ...raf, msPerSec: sums };
  rows.push(row); console.log(JSON.stringify(row));
  await p.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await p.close();
}
