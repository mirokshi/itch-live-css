// usage: CDP_PORT=9479 node probe-fb.mjs <baseUrl> <outDir>
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const CDP = process.env.CDP_HELPER || fileURLToPath(new URL('../a11y-tests/cdp.mjs', import.meta.url));
const { openPage } = await import(pathToFileURL(CDP).href);
const [base, outDir] = process.argv.slice(2);
const props = {1:'content',2:'width',3:'width',4:'color',5:'color',6:'color',7:'color',8:'color',9:'color',10:'height',11:'backdropFilter',
 12:'backgroundClip',13:'maskImage',14:'position',15:'width',16:'userSelect',17:'display',18:'animationDelay',19:'fontWeight',20:'backgroundImage',
 21:'textWrap',22:'top',23:'marginLeft',24:'color',25:'width',26:'color',27:'color'};
const PROBE = `(()=>{const p=${JSON.stringify(props)};const o={};for(const [n,pr] of Object.entries(p)){const el=document.querySelector('.f-'+String(n).padStart(2,'0'));o['f-'+String(n).padStart(2,'0')+' '+pr]=String(getComputedStyle(el)[pr]).slice(0,48)}return o})()`;
const res = {};
for (const f of fs.readdirSync(outDir).filter((f) => /^h-fb\..*\.html$/.test(f)).sort()) {
  const p = await openPage(`${base}/${f}`, { width: 800, height: 900 }); res[f.slice(5, -5)] = await p.eval(PROBE); await p.close();
}
fs.writeFileSync(path.join(outDir, 'probe-fb-results.json'), JSON.stringify(res, null, 1));
console.log('source:', JSON.stringify(res.source, null, 0));
for (const [k, v] of Object.entries(res)) { if (k === 'source') continue;
  const d = Object.keys(res.source).filter((x) => res.source[x] !== v[x]).map((x) => `${x}: ${res.source[x]} -> ${v[x]}`);
  console.log(`-- ${k}: ${d.length ? d.join(' | ') : 'identical'}`); }
