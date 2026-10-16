// Load every h-*.html from a local http server in headless Chrome (CDP) and read computed values.
// usage: CDP_PORT=9479 node probe.mjs <baseUrl> <outDir>   (baseUrl e.g. http://127.0.0.1:8791)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const CDP = process.env.CDP_HELPER || fileURLToPath(new URL('../a11y-tests/cdp.mjs', import.meta.url));
const { openPage } = await import(pathToFileURL(CDP).href);
const [base, outDir] = process.argv.slice(2);
const PROBE = `(()=>{const q=s=>document.querySelector(s), cs=(s,p)=>getComputedStyle(q(s),p||null);
const sh=document.getElementById('custom_css').sheet;
return {
 rules: sh.cssRules.length, firstRule: sh.cssRules[0] && sh.cssRules[0].constructor.name,
 imports: [...sh.cssRules].filter(r=>r instanceof CSSImportRule).length,
 alt: cs('.p-alt','::before').content, rand: cs('.p-rand').width,
 bdf: cs('.p-bdf').backdropFilter, bdfBg: cs('.p-bdf').backgroundColor,
 mix: cs('.p-mix').backgroundColor, mixv: cs('.p-mixv').color, fut: cs('.p-fut').color,
 sib: cs('.p-sib').animationDelay, sel: cs('.p-sel','::selection').backgroundColor,
 calc: cs('.p-calc').width, calc0: cs('.p-calc0').width, str: cs('.p-str','::after').content,
 raw: cs('.p-raw','::after').content, esc: cs('.p-esc','::after').content,
 nest: cs('.p-nest').color, nestWs: cs('.p-nest').wordSpacing, kid: cs('.p-kid').color, deep: cs('.p-deep').color,
 prop: cs('.p-prop').rotate, layer: cs('.p-layer').color, tie: cs('.p-tie').color, imp: cs('.p-imp').color,
 x: cs('.p-x').color, u: cs('.p-u').outlineColor, dbl: cs('.p-dbl').color, mq: cs('.p-mq').color, mq2: cs('.p-mq2').color,
 shM: cs('.p-sh1').marginLeft, shP: cs('.p-sh1').paddingLeft, and: cs('.p-and').letterSpacing,
 svg: cs('.p-svg').backgroundImage.slice(0,60), start: cs('.p-start').opacity, ua: navigator.userAgent.match(/Chrome\\/[\\d.]+/)[0] };})()`;
const pages = fs.readdirSync(outDir).filter((f) => /^h-.*\.html$/.test(f)).sort();
const res = {};
for (const f of pages) {
  const p = await openPage(`${base}/${f}`, { width: 800, height: 900 });
  res[f.slice(2, -5)] = await p.eval(PROBE);
  await p.close();
}
fs.writeFileSync(path.join(outDir, 'probe-results.json'), JSON.stringify(res, null, 1));
// Diff every output against its source page
for (const group of ['main', 'lf']) {
  const src = res[`${group}.source`];
  console.log(`\n== ${group}: source values`);
  console.log(JSON.stringify(src));
  for (const [k, v] of Object.entries(res)) {
    if (!k.startsWith(group + '.') || k === `${group}.source`) continue;
    const diffs = Object.keys(src).filter((key) => key !== 'rules' && JSON.stringify(src[key]) !== JSON.stringify(v[key]))
      .map((key) => `${key}: ${JSON.stringify(src[key])} -> ${JSON.stringify(v[key])}`);
    console.log(`-- ${k} (rules ${v.rules}): ${diffs.length ? diffs.join(' | ') : 'identical'}`);
  }
}
