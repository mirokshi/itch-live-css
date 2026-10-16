// pw-ax-spoiler.mjs <engine> <sr-spoiler.html> <itch game.css copy> - accessibility-tree text of itch spoilers, before
// and after focus, in chromium / firefox / webkit (Playwright page.accessibility.snapshot). Both files are served from a
// fake origin (http://probe.test/) by page.route, so nothing leaves the machine. Run from a dir with playwright@1.56.x.
import fs from 'node:fs';
import { firefox, webkit, chromium } from 'playwright';
const [engine, pageFile, cssFile] = process.argv.slice(2);
const browser = await { firefox, webkit, chromium }[engine].launch(engine === 'chromium' ? { channel: 'chrome' } : {});
const page = await browser.newPage();
await page.route('**/*', (r) => {
  const u = r.request().url();
  if (u === 'http://probe.test/sr-spoiler.html') return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(pageFile) });
  if (u === 'http://probe.test/itch.css') return r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(cssFile) });
  return r.abort();
});
await page.goto('http://probe.test/sr-spoiler.html');
await page.waitForTimeout(300);
const flat = (n, out = []) => { if (!n) return out; out.push(n); (n.children || []).forEach((c) => flat(c, out)); return out; };
const leaves = async (sel) => {
  const snap = await page.accessibility.snapshot({ root: await page.$(sel), interestingOnly: false });
  return flat(snap).filter((n) => !n.children || !n.children.length).map((n) => `${n.role}:${JSON.stringify(n.name || '')}`).join(' ');
};
const style = (sel) => page.$eval(sel, (e) => { const c = getComputedStyle(e); const k = e.firstElementChild ? getComputedStyle(e.firstElementChild).visibility : '-'; return `fill=${c.webkitTextFillColor} bg=${c.backgroundColor} childVisibility=${k}`; });
const out = { engine, version: browser.version() };
out.unfocused = { s1: await leaves('#s1'), s2: await leaves('#s2'), sp1: await style('#sp1'), sp2: await style('#sp2') };
await page.focus('#sp2');
out.sp2Focused = { s2: await leaves('#s2'), sp2: await style('#sp2') };
console.log(JSON.stringify(out, null, 1));
await browser.close();
