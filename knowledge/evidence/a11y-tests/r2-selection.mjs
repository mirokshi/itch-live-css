import { openPage } from './cdp.mjs';
const [url, out] = process.argv.slice(2);
const p = await openPage(url, { width: 500, height: 140 });
await p.eval(`(()=>{const r=document.createRange();r.setStart(document.getElementById('a'),0);r.setEnd(document.getElementById('b'),document.getElementById('b').childNodes.length);const s=getSelection();s.removeAllRanges();s.addRange(r)})()`);
await new Promise(r=>setTimeout(r,300)); await p.shot(out); await p.close();
