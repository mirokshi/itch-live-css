// Reflow / text-zoom test: horizontal overflow at several widths and default font sizes.
import { openPage } from './cdp.mjs';
const [url, extraCss] = process.argv.slice(2);
for (const fontSize of [16, 32]) for (const width of [320, 375, 640, 800, 1280]) {
  const p = await openPage(url, { width, height: 800, fontSize, media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (extraCss) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(extraCss)};document.head.append(s)})()`);
  const r = await p.eval(`(()=>{
    const de=document.documentElement; const vw=de.clientWidth;
    const off=[...document.querySelectorAll('#wrapper *')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.right>vw+1&&!e.closest('[style*=overflow]')})
      .filter(e=>!e.parentElement || e.parentElement.getBoundingClientRect().right<=vw+1).slice(0,4).map(e=>(e.className||e.tagName).toString().slice(0,30)+':'+Math.round(e.getBoundingClientRect().right));
    const t=document.querySelector('.custom-title').getBoundingClientRect();
    return {vw, scrollW:de.scrollWidth, hscroll:de.scrollWidth>vw, titleW:Math.round(t.width), titleFont:getComputedStyle(document.querySelector('.custom-title')).fontSize,
      cols:getComputedStyle(document.querySelector('.user_game_grid')).gridTemplateColumns.split(' ').length, offenders:off};})()`);
  console.log('font', fontSize, 'w', String(width).padEnd(5), JSON.stringify(r));
  await p.close();
}
