// Count running animations under reduce: (a) page stripped of its own reduced-motion rules, (b) + the a11y-23 block injected, (c) + only '#wrapper *,#wrapper *::before'.
import { openPage } from './cdp.mjs';
const url = process.argv[2];
const BLOCK = '@media (prefers-reduced-motion:reduce){#wrapper,#wrapper *,#wrapper *::before,#wrapper *::after,#wrapper::before,#wrapper::after{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}';
const NARROW = '@media (prefers-reduced-motion:reduce){#wrapper *,#wrapper *::before{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}';
for (const [label, css, rm] of [['stripped/no-pref', '', 'no-preference'], ['stripped/reduce', '', 'reduce'], ['claimed-block/reduce', BLOCK, 'reduce'], ['narrow-block/reduce', NARROW, 'reduce']]) {
  const p = await openPage(url, { media: [{ name: 'prefers-reduced-motion', value: rm }], beforeLoad: async (send) => {
    if (css) await send('Page.addScriptToEvaluateOnNewDocument', { source: `document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})` });
  } });
  const r = await p.eval(`(()=>{const a=document.getAnimations();const by={};for(const x of a){const k=(x.animationName||'?')+(x.effect&&x.effect.pseudoElement||'');by[k]=(by[k]||0)+1}
    return {total:a.length, infinite:a.filter(x=>x.effect&&x.effect.getTiming().iterations===Infinity).length, by, cellTransition:getComputedStyle(document.querySelector('#wrapper .game_cell')).transitionDuration,
      bioOpacity:getComputedStyle(document.querySelector('.user_profile')).opacity}})()`);
  console.log(label.padEnd(22), JSON.stringify(r));
  await p.close();
}
