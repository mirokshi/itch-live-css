// gapfill-02 (2026-10-14): which reduced-motion guard stops all animations, and which transition form
// lets a hover/class transition reach its end state (normal timeline and frozen timeline).
// usage: CDP_PORT=9482 node motion-guard.mjs <file-URL of motion-guard.html>
import { openPage } from '../a11y-tests/cdp.mjs';
const [url] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SIX = '#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after';
const THREE = '#wrapper *,#wrapper *::before,#wrapper *::after';
const guards = {
  none: '',
  three_none: `@media (prefers-reduced-motion:reduce){${THREE}{animation:none!important;transition:none!important}}`,
  six_none: `@media (prefers-reduced-motion:reduce){${SIX}{animation:none!important;transition:none!important}}`,
  six_dur: `@media (prefers-reduced-motion:reduce){${SIX}{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}`,
  six_dur_nodelay: `@media (prefers-reduced-motion:reduce){${SIX}{animation:none!important;transition-duration:.01ms!important}}`,
};
const probe = `(()=>{const T=id=>getComputedStyle(document.getElementById(id)).transform;
  const all=document.getAnimations();
  const lab=x=>{const t=x.effect.target;return (t.id?'#'+t.id:'.'+t.className)+(x.effect.pseudoElement||'')};
  return {runningAnims:all.filter(a=>a.constructor.name==='CSSAnimation'&&a.playState==='running').map(lab).join(' ')||'-',
    transitions:all.filter(a=>a.constructor.name==='CSSTransition').map(a=>lab(a)+':'+a.playState).join(' ')||'-',
    h:T('hcard'),c:T('ccard'),ev:JSON.stringify(window.__ev)}})()`;
const init = `window.__ev={run:0,end:0};addEventListener('transitionrun',()=>__ev.run++,true);addEventListener('transitionend',()=>__ev.end++,true);`;

for (const [name, css] of Object.entries(guards)) {
  for (const rm of name === 'none' ? ['no-preference', 'reduce'] : ['reduce']) {
    for (const frozen of [false, true]) {
      const p = await openPage(url, { width: 900, height: 600, media: [{ name: 'prefers-reduced-motion', value: rm }] });
      await p.eval(`document.getElementById('guard').textContent=${JSON.stringify(css)};${init}`);
      await sleep(300);
      if (frozen) { await p.send('Animation.enable'); await p.send('Animation.setPlaybackRate', { playbackRate: 0 }); }
      const b = await p.eval(`(()=>{const r=document.getElementById('hcard').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y });
      await p.eval(`document.getElementById('ccard').classList.add('on')`);
      const rows = {};
      for (const t of [0, 100, 300, 1200]) {
        if (t) await sleep(t - (rows.last || 0));
        rows['t' + t] = await p.eval(probe); rows.last = t;
      }
      delete rows.last;
      console.log('GUARD', name.padEnd(15), rm.padEnd(13), frozen ? 'frozen' : 'normal');
      for (const [k, v] of Object.entries(rows)) console.log('   ', k.padEnd(6), JSON.stringify(v));
      await p.close();
    }
  }
}
console.log('done');
