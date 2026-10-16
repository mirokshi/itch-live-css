// Focus an element by keyboard (Tab N times) and capture a zoomed crop of its focus ring.
import { openPage } from './cdp.mjs';
import fs from 'node:fs';
const [url, tabs, out, extraCss] = process.argv.slice(2);
const p = await openPage(url, { width: 1280, height: 900 });
if (extraCss) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(extraCss)};document.head.append(s)})()`);
for (let i = 0; i < +tabs; i++) { for (const type of ['keyDown','keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await new Promise(r=>setTimeout(r,250)); }
await new Promise(r=>setTimeout(r,500));
const r = await p.eval(`(()=>{const a=document.activeElement;const b=a.getBoundingClientRect();const cs=getComputedStyle(a);return {t:a.textContent.trim(),x:b.x,y:b.y,w:b.width,h:b.height,o:cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor+' off '+cs.outlineOffset}})()`);
console.log(JSON.stringify(r));
const res = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x - 8, y: r.y - 8, width: r.w + 16, height: r.h + 16, scale: 6 } });
fs.writeFileSync(out, Buffer.from(res.data, 'base64'));
await p.close();
