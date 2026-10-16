// pw-ax.mjs <engine> <file-url> - accessible names in Firefox or WebKit (Playwright's page.accessibility.snapshot,
// which reads the engine's own accessibility tree), for every #pNN element of sr-probe.html.
// Run from a dir whose node_modules has playwright@1.56.x, with PLAYWRIGHT_BROWSERS_PATH set. Offline: every
// non-file request is aborted.
import { firefox, webkit, chromium } from 'playwright';
const [engine, url] = process.argv.slice(2);
const browser = await { firefox, webkit, chromium }[engine].launch(engine === 'chromium' ? { channel: 'chrome' } : {});
const page = await browser.newPage();
await page.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
await page.goto(url);
await page.waitForTimeout(300);
const flat = (n, out = []) => { if (!n) return out; out.push(n); (n.children || []).forEach((c) => flat(c, out)); return out; };
const ids = await page.$$eval('[id^="p"]', (els) => els.map((e) => e.id));
const out = { engine, version: browser.version(), rows: {} };
for (const id of ids) {
  const h = await page.$('#' + id);
  const snap = await page.accessibility.snapshot({ root: h, interestingOnly: false });
  const nodes = flat(snap);
  out.rows[id] = {
    role: snap && snap.role, level: snap && snap.level, name: snap && snap.name,
    // leaves = the text pieces a browse-mode reader walks, in order
    leaves: nodes.filter((n) => !n.children || !n.children.length).map((n) => `${n.role}:${JSON.stringify(n.name || '')}`),
  };
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
