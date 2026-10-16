import { openPage } from './cdp.mjs';
const url = process.argv[2];
for (const rm of ['no-preference', 'reduce']) {
  const p = await openPage(url, { media: [{ name: 'prefers-reduced-motion', value: rm }] });
  const r = await p.eval(`(()=>{
    const anims = document.getAnimations();
    const byName = {};
    for (const a of anims) { const k=(a.animationName||a.transitionProperty||'?')+(a.effect&&a.effect.pseudoElement?a.effect.pseudoElement:''); byName[k]=(byName[k]||0)+1; }
    const infinite = anims.filter(a=>a.effect&&a.effect.getTiming().iterations===Infinity).length;
    const cell = document.querySelector('#wrapper .game_cell');
    return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, total: anims.length, infinite, byName,
      cellTransition: getComputedStyle(cell).transitionDuration,
      bioOpacity: getComputedStyle(document.querySelector('.user_profile')).opacity,
      helloBeforeAnim: getComputedStyle(document.querySelector('.custom-hello'),'::before').animationName,
      wrapperAfterAnim: getComputedStyle(document.querySelector('#wrapper'),'::after').animationName,
      h1Anim: getComputedStyle(document.querySelector('h1.custom-title')).animationName };
  })()`);
  console.log(rm, JSON.stringify(r, null, 0));
  await p.close();
}
