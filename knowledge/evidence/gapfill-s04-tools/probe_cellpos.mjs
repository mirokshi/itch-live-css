// s04 retry: is .game_cell already positioned in itch's CSS (so that adding position:relative for a ::after ring
// overlay changes nothing), and where do the hover-only .game_cell_tools sit? Prints per page the first card's
// computed position, the tools' offsetParent and the card's ::after content.
// usage: CDP_PORT=9489 CDP_BLOCK_ITCH=1 node probe_cellpos.mjs <file URL> [...]
import { openPage } from '../a11y-tests/cdp.mjs';
for (const url of process.argv.slice(2)) {
  const p = await openPage(url, { width: 1280, height: 900 });
  console.log('CELLPOS', url.split('/').pop(), await p.eval(`(()=>{const c=document.querySelector('#wrapper .game_cell');if(!c)return 'no cell';
    const t=c.querySelector('.game_cell_tools');const op=t&&t.offsetParent;
    const pos=[...document.querySelectorAll('#wrapper .game_cell')].reduce((m,x)=>{const k=getComputedStyle(x).position;m[k]=(m[k]||0)+1;return m},{});
    return JSON.stringify({cellPositions:pos,toolsOffsetParent:op?(op.className||op.tagName).toString().slice(0,40):'-',
      cellAfter:getComputedStyle(c,'::after').content,cellBefore:getComputedStyle(c,'::before').content})})()`));
  await p.close();
}
