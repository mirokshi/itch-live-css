// WCAG 1.4.12 text-spacing override + clipped-content scan; also reports body font-size under a 32px default font.
import { openPage } from './cdp.mjs';
const url = process.argv[2];
const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
for (const [label, css, fontSize] of [['baseline', '', 16], ['text-spacing', SPACING, 16], ['font32', '', 32]]) {
  const p = await openPage(url, { width: 1280, fontSize, media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (css) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})()`);
  await new Promise(r => setTimeout(r, 300));
  const r = await p.eval(`(()=>{
    const clipped=[...document.querySelectorAll('#wrapper *')].filter(e=>{const c=getComputedStyle(e);return /hidden|clip/.test(c.overflow+c.overflowX+c.overflowY)&&e.textContent.trim()&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)})
      .slice(0,8).map(e=>(e.className||e.tagName)+'['+e.scrollWidth+'x'+e.scrollHeight+' in '+e.clientWidth+'x'+e.clientHeight+']');
    return {bodyFont:getComputedStyle(document.body).fontSize, bioFont:getComputedStyle(document.querySelector('.user_profile')).fontSize, gameTitleFont:getComputedStyle(document.querySelector('.game_title')).fontSize,
      hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth, clipped};})()`);
  console.log(label.padEnd(13), JSON.stringify(r));
  await p.close();
}
