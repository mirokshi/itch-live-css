// s04-gf-04: visual check of the published focus block (variant V6 of focus_matrix.mjs): Tab to the first stop
// matching a selector and save a screenshot of the focused card / element (+12px margin).
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 node focus_shots.mjs <page file URL> <stop selector> <out.png> [css] [width]
import { openPage } from '../a11y-tests/cdp.mjs';
const [page, sel, out, cssArg, w] = process.argv.slice(2);
const G = '#ffc857';
const V6 = `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
  `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
  `#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}` +
  `#wrapper .game_cell:has(:focus-visible){outline:3px solid var(--focus-ring);outline-offset:-3px}` +
  `#wrapper .game_cell:has(:focus-visible) .game_cell_tools{opacity:1}`;
const css = cssArg === undefined || cssArg === 'V6' ? V6 : cssArg;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const p = await openPage(page, { width: +(w || 1280), height: 900 });
await p.eval(`document.getElementById('fix').textContent=${JSON.stringify(css)};1`);
for (let i = 0; i < 400; i++) {
  for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await sleep(15);
  if (await p.eval(`document.activeElement.matches(${JSON.stringify(sel)})`)) break;
}
await sleep(400); // let itch's own transitions finish
const clip = await p.eval(`(()=>{const a=document.activeElement,t=a.closest('.game_cell')||a;t.scrollIntoView({block:'center',inline:'nearest'});
  const r=t.getBoundingClientRect();return {x:Math.max(0,r.left-12+scrollX),y:Math.max(0,r.top-12+scrollY),width:r.width+24,height:r.height+24}})()`);
await sleep(100);
await p.shot(out, clip);
console.log('SHOT', out, JSON.stringify(clip), await p.eval(`document.activeElement.className`));
await p.close();
