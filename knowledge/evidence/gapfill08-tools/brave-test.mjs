// WARNING (2026-10-14): in this run Brave 1.97.56 (Chromium 155) did NOT honour --host-resolver-rules, so every
// "mapped" request (mirokshi.itch.io, static.itch.io, fonts, the Vercel service) went to the LIVE hosts. Do not
// re-run this as an offline test; verify the mapping first (e.g. check that the local https server logs the hits),
// or route Brave through a local proxy instead. See evidence/gapfill.md, "Gap fill for 08", Brave section.
// Brave Shields check of the owner's @import (gapfill-08, 2026-10-14).
// usage: node brave-test.mjs <bravePath> <profileDir> <waitForListsMs>
// Fresh throw-away profile (never the user's). https://mirokshi.itch.io/ is mapped to a local HTTPS server that
// serves a same-day copy of the profile page; third-party hosts under test are mapped to NOTFOUND, so a request
// that Shields lets through fails with ERR_NAME_NOT_RESOLVED and one that Shields blocks fails with
// ERR_BLOCKED_BY_CLIENT (the adblock check runs before DNS). Brave's own component-update hosts are not mapped.
import { spawn } from 'node:child_process';

const [bravePath, profile, waitS] = process.argv.slice(2);
const PORT = 9488;
const rules = ['MAP mirokshi.itch.io 127.0.0.1', 'MAP itch-io-custom-css-custom-css.vercel.app ~NOTFOUND',
  'MAP fonts.googleapis.com ~NOTFOUND', 'MAP fonts.gstatic.com ~NOTFOUND', 'MAP static.itch.io ~NOTFOUND',
  'MAP img.itch.zone ~NOTFOUND', 'MAP itch.io ~NOTFOUND', 'MAP www.google-analytics.com ~NOTFOUND',
  'MAP www.googletagmanager.com ~NOTFOUND', 'MAP connect.facebook.net ~NOTFOUND', 'MAP css-test.example ~NOTFOUND'].join(', ');
const brave = spawn(bravePath, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', `--host-resolver-rules=${rules}`, '--ignore-certificate-errors',
  '--window-size=1200,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = [];
for (let i = 0; i < 100; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); let reqs = {};
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Network.requestWillBeSent') reqs[m.params.requestId] = { url: m.params.request.url.slice(0, 90), type: m.params.type };
  if (m.method === 'Network.loadingFailed' && reqs[m.params.requestId]) Object.assign(reqs[m.params.requestId], { err: m.params.errorText, blocked: m.params.blockedReason });
  if (m.method === 'Network.loadingFinished' && reqs[m.params.requestId]) reqs[m.params.requestId].ok = true;
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
console.log(JSON.stringify({ browser: (await send('Browser.getVersion')).result }));
await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
async function visit(url, waitMs = 4000) { reqs = {}; await send('Page.navigate', { url }); await sleep(waitMs); return Object.values(reqs).filter((r) => !r.url.startsWith('data:')); }
const t0 = Date.now(); let control = [];
while (Date.now() - t0 < Number(waitS)) {
  control = await visit('https://mirokshi.itch.io/control.html');
  const ga = control.find((r) => r.url.includes('google-analytics'));
  console.log(JSON.stringify({ t: Math.round((Date.now() - t0) / 1000), controlGA: ga ? (ga.err || "ok") : "no-request", n: control.length, sample: control.slice(0, 6) }));
  if (ga && ga.err && ga.err.includes('BLOCKED')) break;
  await sleep(15000);
}
console.log(JSON.stringify({ control }));
const profilePage = await visit('https://mirokshi.itch.io/', 6000);
console.log(JSON.stringify({ profile: profilePage.filter((r) => !/static\.itch\.io|img\.itch\.zone|^https:\/\/itch\.io/.test(r.url)) }));
const variants = await visit('https://mirokshi.itch.io/variants.html', 5000);
console.log(JSON.stringify({ variants }));
ws.close(); brave.kill(); process.exit(0);
