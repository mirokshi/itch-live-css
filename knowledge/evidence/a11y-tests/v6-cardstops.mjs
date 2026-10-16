// Tab through a profile and classify each focus stop inside a .game_cell (title link / author link / other).
import { openPage } from './cdp.mjs';
const [url, n = 60] = process.argv.slice(2);
const p = await openPage(url, { width: 1280, height: 900 });
const kinds = {}; const perCell = new Map();
for (let i = 0; i < +n; i++) {
  for (const type of ['keyDown','keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const r = await p.eval(`(()=>{const a=document.activeElement;const c=a&&a.closest('.game_cell');if(!c)return null;
    const k=a.closest('.game_title')?'title':a.closest('.game_author')?'author':(a.className||a.tagName);
    const cells=[...document.querySelectorAll('.game_cell')];return {k, cell:cells.indexOf(c), section:(c.closest('.user_game_grid,.purchased_games,.collection_row')||{}).className||'?'}})()`);
  if (!r) continue; const key = r.section.split(' ')[0] + ':' + r.k; kinds[key] = (kinds[key] || 0) + 1;
}
console.log(JSON.stringify(kinds));
await p.close();
