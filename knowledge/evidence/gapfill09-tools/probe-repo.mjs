// Compare every computed property of every element (and ::before/::after) under #wrapper between
// h-repo.source.html and each minified variant. Remote hosts are blocked so runs are deterministic.
// usage: CDP_PORT=9479 node probe-repo.mjs <baseUrl> <outRepoDir> [width]
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const CDP = process.env.CDP_HELPER || fileURLToPath(new URL('../a11y-tests/cdp.mjs', import.meta.url));
const { openPage } = await import(pathToFileURL(CDP).href);
const [base, dir, w] = process.argv.slice(2);
const width = Number(w || 1280);
const block = async (send) => { await send('Network.enable'); await send('Network.setBlockedURLs', { urls: ['*itch.zone*', '*itch.io*', '*vercel.app*', '*googleapis.com*', '*gstatic.com*'] }); };
const SNAP = `(()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=0});
const els=[document.getElementById('wrapper'),...document.querySelectorAll('#wrapper *')];const out={};
els.forEach((el,i)=>{for(const pe of [null,'::before','::after']){const cs=getComputedStyle(el,pe);
 if(pe&&cs.content==='none')continue;const o={};for(let j=0;j<cs.length;j++){const p=cs[j];o[p]=cs.getPropertyValue(p)}
 out[i+':'+el.tagName+'.'+String(el.className).slice(0,30)+(pe||'')]=o}});return out})()`;
const snaps = {};
for (const f of fs.readdirSync(dir).filter((f) => /^h-repo\..*\.html$/.test(f)).sort()) {
  const p = await openPage(`${base}/${f}`, { width, height: 900, beforeLoad: block });
  snaps[f.slice(7, -5)] = await p.eval(SNAP); await p.close();
}
const src = snaps.source;
const summary = {};
for (const [k, v] of Object.entries(snaps)) {
  if (k === 'source') continue;
  const diffs = [];
  for (const el of new Set([...Object.keys(src), ...Object.keys(v)])) {
    const a = src[el] || {}, b = v[el] || {};
    for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[p] !== b[p]) diffs.push(`${el} ${p}: ${String(a[p]).slice(0, 60)} -> ${String(b[p]).slice(0, 60)}`);
  }
  const real = diffs.filter((d) => !/ --[\w-]+: /.test(d));
  summary[k] = { elements: Object.keys(v).length, diffs: diffs.length, nonCustomProp: real.length, first: diffs.slice(0, 12), firstReal: real.slice(0, 12) };
  console.log(`-- ${k}: ${Object.keys(v).length} boxes, ${diffs.length} differing values, ${real.length} outside custom properties`);
  diffs.slice(0, 4).forEach((d) => console.log('     ' + d));
  real.slice(0, 12).forEach((d) => console.log('     REAL ' + d));
}
console.log(`source: ${Object.keys(src).length} boxes (elements + generated ::before/::after), width ${width}`);
fs.writeFileSync(path.join(dir, `probe-repo-${width}.json`), JSON.stringify(summary, null, 1));
