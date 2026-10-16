// Stall lab driver for Firefox and WebKit via Playwright (gapfill-08, 2026-10-14).
// usage: PLAYWRIGHT_BROWSERS_PATH=<dir> node stall-pw.mjs <firefox|webkit> <capMs> <pageUrl> [...]
// (run from a directory whose node_modules has playwright). One browser instance per page, all in parallel.
import { firefox, webkit } from 'playwright';

const [engineName, capMsS, ...pages] = process.argv.slice(2);
const engine = { firefox, webkit }[engineName];
const capMs = Number(capMsS);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(url) {
  const browser = await engine.launch({ headless: true });
  const version = browser.version();
  const page = await (await browser.newContext()).newPage();
  const name = url.split('/').pop();
  let t0 = 0; const imp = {}; let loadAt = null;
  page.on('request', (r) => { if (r.resourceType() === 'stylesheet' && !imp.url) Object.assign(imp, { url: r.url(), sent: Date.now() - t0 }); });
  page.on('response', (r) => { if (r.url() === imp.url) imp.headers = Date.now() - t0; });
  page.on('requestfinished', (r) => { if (r.url() === imp.url) imp.finished = Date.now() - t0; });
  page.on('requestfailed', (r) => { if (r.url() === imp.url) Object.assign(imp, { failed: Date.now() - t0, error: r.failure()?.errorText }); });
  page.on('load', () => { loadAt = Date.now() - t0; });
  t0 = Date.now();
  page.goto(url, { waitUntil: 'commit', timeout: 0 }).catch((e) => { imp.gotoError = String(e).slice(0, 120); });
  let state = {};
  while (Date.now() - t0 < capMs) {
    await sleep(250);
    try {
      state = await page.evaluate(() => ({
        fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime ?? null,
        paintTypes: performance.getEntriesByType('paint').map((e) => e.name),
        end: window.__endScript ?? null, rs: document.readyState,
        color: document.querySelector('#wrapper p') ? getComputedStyle(document.querySelector('#wrapper p')).color : null,
      }));
    } catch (e) { state.evalError = String(e).slice(0, 80); }
    const settled = imp.url && (imp.failed != null || imp.finished != null);
    if (state.end != null && (settled || !imp.url || name.startsWith('s0')) && loadAt != null && (state.fcp != null || Date.now() - t0 > 8000)) break;
  }
  await browser.close();
  return { page: name, browser: `${engineName} ${version}`, capMs,
    fcpMs: state.fcp != null ? Math.round(state.fcp) : (state.paintTypes?.length ? 'n/a' : `none by end`),
    paintTypes: state.paintTypes, endScriptMs: state.end != null ? Math.round(state.end) : `>${capMs}`,
    loadMs: loadAt ?? `>${capMs}`, readyState: state.rs, pColor: state.color, import: imp.url ? imp : null };
}

const results = await Promise.all(pages.map((u) => runOne(u).catch((e) => ({ page: u, error: String(e).slice(0, 200) }))));
for (const r of results) console.log(JSON.stringify(r));
process.exit(0);
