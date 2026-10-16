// s04-gf-03: why card rings inside itch's horizontal scrollers (.carousel_wrapper on profiles; .user_game_grid in the
// ≤800px column layout) still read as clipped with an inset ring: print, per Tab stop inside a scroller, the card's
// and the focused link's position relative to the scroller's visible box.
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 W=1280 node scroller_detail.mjs <file URL of focus_profile.html> "<css>"
import { openPage } from '../a11y-tests/cdp.mjs';
const [page, css] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const p = await openPage(page, { width: +(process.env.W || 1280), height: 900 });
await p.eval(`document.getElementById('fix').textContent=${JSON.stringify(css)};
  const n=document.createElement('style');n.textContent='#wrapper *{transition:none!important}';document.head.appendChild(n);1`);
let inside = false;
for (let i = 0; i < 400; i++) {
  for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await sleep(15);
  const r = await p.eval(`(()=>{const a=document.activeElement;if(!a||a===document.body)return null;const inW=!!a.closest('#wrapper');
    const sc=a.closest('.carousel_wrapper,.user_game_grid');if(!inW||!sc)return {inW};
    const cs=getComputedStyle(sc);if(cs.overflowX==='visible')return {inW};
    const b=sc.getBoundingClientRect(),cell=a.closest('.game_cell'),c=cell.getBoundingClientRect(),l=a.getBoundingClientRect();
    const o=getComputedStyle(cell);const e=parseFloat(o.outlineWidth)+parseFloat(o.outlineOffset);
    const side=(x)=>['t'+Math.round(x.top-e-b.top),'b'+Math.round(b.bottom-x.bottom-e),'l'+Math.round(x.left-e-b.left),'r'+Math.round(b.right-x.right-e)].join(' ');
    return {inW,sc:sc.className.split(' ').slice(-1)[0],scrollLeft:Math.round(sc.scrollLeft),cellW:Math.round(c.width),
      linkW:Math.round(l.width),cat:a.className||a.tagName,cardRoom:side(c)}})()`);
  if (!r) continue; if (r.inW) inside = true; else if (inside) break;
  if (r.sc) console.log('SCROLLER', JSON.stringify(r));
}
await p.close();
