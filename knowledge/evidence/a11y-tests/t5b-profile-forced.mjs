import { openPage } from './cdp.mjs';
const [url, out] = process.argv.slice(2);
for (const fc of ['none','active']) {
  const p = await openPage(url, { width: 1280, height: 900, media: [{ name: 'forced-colors', value: fc }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  const r = await p.eval(`(()=>{const h=document.querySelector('.custom-hello');const cs=getComputedStyle(h);const b=getComputedStyle(h,'::before');
    const w=getComputedStyle(document.querySelector('#wrapper'));
    return {helloColor:cs.color, helloBeforeColor:b.color, wrapperBgImage:w.backgroundImage.slice(0,60), starsBefore:getComputedStyle(document.querySelector('#wrapper'),'::before').backgroundImage.slice(0,40),
     cellBorder:getComputedStyle(document.querySelector('.game_cell')).borderTopColor, cellShadow:getComputedStyle(document.querySelector('.game_cell')).boxShadow}})()`);
  console.log(fc, JSON.stringify(r));
  const b = await p.eval(`(()=>{const r=document.querySelector('.user_profile').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  const res = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
  (await import('node:fs')).writeFileSync(`${out}-${fc}.png`, Buffer.from(res.data, 'base64'));
  await p.close();
}
