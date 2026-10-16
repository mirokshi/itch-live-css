// Section-10 extra checks (2026-10-14). usage: CDP_PORT=9471 node s10.mjs <pagesDir(file URL prefix)> <outDir>
import { openPage } from '../a11y-tests/cdp.mjs';
import fs from 'node:fs';
const [base, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. reduced-motion guard coverage ----
const guards = {
  none: '',
  repo: '@media (prefers-reduced-motion:reduce){#wrapper *,#wrapper *::before{animation:none!important;transition-duration:.01ms!important}}',
  descendants3: '@media (prefers-reduced-motion:reduce){#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}',
  full: '@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}',
};
for (const [name, css] of Object.entries(guards)) {
  for (const rm of name === 'none' ? ['no-preference', 'reduce'] : ['reduce']) {
    const p = await openPage(`${base}/s10-motion.html`, { media: [{ name: 'prefers-reduced-motion', value: rm }] });
    await p.eval(`document.getElementById('guard').textContent=${JSON.stringify(css)}`);
    await sleep(900);
    const r = await p.eval(`(()=>{const a=document.getAnimations().filter(x=>x.playState==='running');
      const lab=x=>{const t=x.effect.target;return (t.id?'#'+t.id:'.'+t.className)+(x.effect.pseudoElement||'')};
      return {running:a.length,which:a.map(lab).join(' '),
        good:getComputedStyle(document.querySelector('.enter-good')).opacity,
        bad:getComputedStyle(document.querySelector('.enter-bad')).opacity,
        cardTransition:getComputedStyle(document.querySelector('.card')).transition}})()`);
    console.log('MOTION', name.padEnd(12), rm.padEnd(13), JSON.stringify(r));
    await p.close();
  }
}

// ---- 2. hover gating: touch tap vs mouse hover ----
for (const touch of [true, false]) {
  const p = await openPage(`${base}/s10-hover-focus.html`, { width: touch ? 375 : 1280, height: 800, touch });
  const mq = await p.eval(`['(hover: hover)','(hover: none)','(pointer: coarse)'].map(m=>m+'='+matchMedia(m).matches).join(' ')`);
  const res = {};
  for (const id of ['cellA', 'cellB']) {
    const b = await p.eval(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    if (touch) {
      await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] });
      await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y });
    }
    await sleep(500);
    res[id] = await p.eval(`(()=>{const e=document.getElementById('${id}');return ':hover='+e.matches(':hover')+' transform='+getComputedStyle(e).transform})()`);
  }
  console.log('HOVER', touch ? 'touch' : 'mouse', mq, JSON.stringify(res));
  await p.close();
}

// ---- 3. focus ring inside a line-clamped (overflow:hidden) title ----
const variants = {
  default: ':focus{outline-color:#361275}',
  customLinkRing: ':focus{outline-color:#361275}#wrapper .game_title a:focus-visible{outline:3px solid #ffc857;outline-offset:3px}',
  cardFocusWithin: ':focus{outline-color:#361275}#wrapper .game_cell:focus-within{outline:3px solid #ffc857;outline-offset:3px}',
};
for (const [name, css] of Object.entries(variants)) {
  const p = await openPage(`${base}/s10-hover-focus.html`, { width: 900, height: 500 });
  await p.eval(`document.getElementById('extra').textContent=${JSON.stringify(css)}`);
  for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await sleep(400);
  const r = await p.eval(`(()=>{const a=document.activeElement;const cs=getComputedStyle(a);const c=a.closest('.game_cell').getBoundingClientRect();
    return {active:a.id,focusVisible:a.matches(':focus-visible'),outline:cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor,
      titleOverflow:getComputedStyle(a.closest('.game_title')).overflow,cell:{x:c.x,y:c.y,w:c.width,h:c.height}}})()`);
  console.log('FOCUS', name, JSON.stringify(r));
  const c = r.cell;
  const shot = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: c.x - 10, y: c.y - 10, width: c.w + 20, height: c.h + 20, scale: 2 } });
  fs.writeFileSync(`${out}/focus-${name}.png`, Buffer.from(shot.data, 'base64'));
  await p.close();
}
console.log('done');
