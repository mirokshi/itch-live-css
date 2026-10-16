// cssom-equal.mjs <a.css> <b.css> - parse both files in Chrome (CSSStyleSheet.replaceSync) and diff the rules'
// cssText. Custom-property values keep their author whitespace in CSSOM, so they are compared with
// whitespace removed; every other difference is printed. Needs the Chrome started for lr.mjs ($CDP_PORT).
import fs from 'node:fs';
import { openPage } from '../a11y-tests/cdp.mjs';
const [a, b] = process.argv.slice(2).map((f) => fs.readFileSync(f, 'utf8'));
const p = await openPage('data:text/html,<title>x</title>', { width: 800, height: 600 });
const [x, y] = await p.eval(`(() => { const f = (t) => { const s = new CSSStyleSheet(); s.replaceSync(t); return [...s.cssRules].map((r) => r.cssText); }; return [f(${JSON.stringify(a)}), f(${JSON.stringify(b)})]; })()`);
const norm = (s) => (s || '').replace(/(--[\w-]+:)([^;}]*)/g, (m, k, v) => k + v.replace(/\s+/g, ''));
let diffs = 0;
for (let i = 0; i < Math.max(x.length, y.length); i++) {
  if (x[i] === y[i]) continue;
  if (norm(x[i]) === norm(y[i])) { console.log('custom-property whitespace only, rule', i); continue; }
  diffs++; console.log('DIFF rule', i, '\n  a:', x[i], '\n  b:', y[i]);
}
console.log(JSON.stringify({ rulesA: x.length, rulesB: y.length, realDiffs: diffs }));
await p.close();
