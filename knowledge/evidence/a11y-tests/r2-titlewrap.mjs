import { openPage } from './cdp.mjs';
const [url, css] = process.argv.slice(2);
const p = await openPage(url, { width: +(process.env.W||320), height: 800, fontSize: 32, media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (css) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})()`); await new Promise(r=>setTimeout(r,300));
console.log(await p.eval(`(()=>{const sp=[...document.querySelectorAll('.custom-title span')];const tops=sp.map(s=>Math.round(s.getBoundingClientRect().top));
 const lines=[];sp.forEach((s,i)=>{const t=tops[i];let l=lines.find(x=>Math.abs(x.t-t)<20);if(!l){l={t,txt:''};lines.push(l)}l.txt+=s.textContent});
 return 'lines='+lines.map(l=>l.txt).join(' / ')+' scrollW='+document.documentElement.scrollWidth})()`));
await p.close();
