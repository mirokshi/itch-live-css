import { openPage } from './cdp.mjs';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const p = await openPage(url, { width: 1280, height: 900 });
console.log(await p.eval(`(()=>{const t=document.querySelector('.game_title');const cs=getComputedStyle(t);return {overflow:cs.overflow, display:cs.display, clamp:cs.webkitLineClamp}})()`));
await p.eval(`(()=>{const s=document.createElement('style');s.textContent='#wrapper .game_cell:focus-within{outline:3px solid #ffc857;outline-offset:3px}#wrapper .game_title a:focus-visible{outline:none}';document.head.append(s)})()`);
for (let i = 0; i < 2; i++) { for (const type of ['keyDown','keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await new Promise(r=>setTimeout(r,250)); }
await new Promise(r=>setTimeout(r,500));
const r = await p.eval(`(()=>{const c=document.activeElement.closest('.game_cell').getBoundingClientRect();return {x:c.x,y:c.y,w:c.width,h:c.height}})()`);
const res = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x - 10, y: r.y - 10, width: r.w + 20, height: r.h + 20, scale: 1 } });
fs.writeFileSync(out, Buffer.from(res.data, 'base64'));
await p.close();
