import { openPage } from './cdp.mjs';
const url = process.argv[2];
for (const touch of [false, true]) {
  const p = await openPage(url, { width: touch ? 375 : 1280, touch });
  const q = ['(hover: hover)','(hover: none)','(pointer: fine)','(pointer: coarse)','(any-hover: hover)','(any-pointer: coarse)'];
  const r = await p.eval(`(${JSON.stringify(q)}).map(m=>m+'='+matchMedia(m).matches).join('  ')+'  maxTouchPoints='+navigator.maxTouchPoints`);
  console.log(touch ? 'touch' : 'mouse', r);
  if (touch) {
    // tap a game card: does :hover stick after a tap?
    const b = await p.eval(`(()=>{const c=document.querySelector('#wrapper .game_cell .game_cell_data');c.scrollIntoView();const r=c.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+5}})()`);
    await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] });
    await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise(r => setTimeout(r, 600));
    console.log('after tap: cell :hover =', await p.eval(`document.querySelector('#wrapper .game_cell').matches(':hover')`), ' transform =', await p.eval(`getComputedStyle(document.querySelector('#wrapper .game_cell')).transform`));
  }
  await p.close();
}
