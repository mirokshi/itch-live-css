// Count focusable (tabbable) elements per .game_cell, grouped by the row container class.
import { openPage } from './cdp.mjs';
const p = await openPage(process.argv[2], { width: 1280 });
console.log(JSON.stringify(await p.eval(`(()=>{const out={};
 for (const c of document.querySelectorAll('#wrapper .game_cell')) {
   const row=(c.closest('.purchased_games,.collection_row,.user_game_grid')||{}).className||'?'; const k=row.split(' ')[0];
   const tabbables=[...c.querySelectorAll('a[href],button,[tabindex]')].filter(e=>e.tabIndex>=0 && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden');
   const key=k+':'+tabbables.map(e=>e.closest('.game_title')?'title':e.closest('.game_author')?'author':e.className||e.tagName).join('+');
   out[key]=(out[key]||0)+1; }
 return out;})()`)));
await p.close();
