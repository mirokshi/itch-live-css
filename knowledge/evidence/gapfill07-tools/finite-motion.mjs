// Gap-fill 07 (2026-10-14): infinite vs finite idle motion, read through the Web Animations API.
// Start Chrome first:  chrome --headless=new --remote-debugging-port=9488 --user-data-dir=<scratch> about:blank
// Run:  CDP_PORT=9488 CDP_BLOCK_ITCH=1 node finite-motion.mjs file:///<abs>/finite-motion.html
import { openPage } from '../a11y-tests/cdp.mjs';
const [url] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BREATH = '@property --custom-breath{syntax:"<angle>";inherits:true;initial-value:0deg}@keyframes custom-breath{to{--custom-breath:360deg}}';
const variants = {
  // the pattern 07 §7.5 used to recommend: endless loops
  infinite: BREATH + `
    @keyframes custom-wy{from{translate:0 -.13em}to{translate:0 .13em}}
    #wrapper .custom-title span{display:inline-block;animation:custom-wy 1.6s ease-in-out infinite alternate;
      animation-delay:calc(var(--i)*.4s - 3.2s);font-weight:calc(550 + 150*sin(var(--custom-breath) + 40deg))}
    #wrapper .custom-title{animation:custom-breath 5s linear infinite}
    @keyframes custom-tw{from{opacity:.4}to{opacity:1}}
    #wrapper::after{animation:custom-tw 2.2s ease-in-out infinite alternate}`,
  // finite by default (<= 5 s, ends at rest), replays while hovered
  finite: BREATH + `
    @keyframes custom-wave{25%{translate:0 -.13em;rotate:-4deg}75%{translate:0 .13em;rotate:4deg}}
    @keyframes custom-wave-h{25%{translate:0 -.13em;rotate:-4deg}75%{translate:0 .13em;rotate:4deg}}
    #wrapper .custom-title span{display:inline-block;animation:custom-wave 1.6s ease-in-out calc(var(--i)*.1s) 2;
      font-weight:calc(550 + 150*sin(var(--custom-breath) + 40deg))}
    #wrapper .custom-title:hover span{animation-name:custom-wave-h;animation-iteration-count:infinite}
    #wrapper .custom-title{animation:custom-breath 4s linear 1}
    @keyframes custom-tw{50%{opacity:.4}}
    #wrapper::after{animation:custom-tw 1.2s ease-in-out 4}`,
};
const GUARD = '@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}';

const list = `document.getAnimations().map(a=>{const t=a.effect.target;const c=a.effect.getComputedTiming();
  return {on:(t.id||t.tagName.toLowerCase())+(a.effect.pseudoElement||''),name:a.animationName,state:a.playState,
    iter:c.iterations===Infinity?'inf':c.iterations,end:c.endTime===Infinity?'inf':Math.round(c.endTime)}})`;
const summary = (arr) => { const g = {}; for (const a of arr) { const k = `${a.on.replace(/^span$/, 'span×')} ${a.name} iter=${a.iter} end=${a.end} ${a.state}`; g[k] = (g[k] || 0) + 1; } return g; };
const rest = `(()=>{const s=[...document.querySelectorAll('#title span')].map(e=>getComputedStyle(e));
  return {translate:[...new Set(s.map(c=>c.translate))].join('|'),rotate:[...new Set(s.map(c=>c.rotate))].join('|'),
    weight:[...new Set(s.map(c=>c.fontWeight))].join('|'),afterOpacity:getComputedStyle(document.getElementById('wrapper'),'::after').opacity}})()`;

for (const [name, css] of Object.entries(variants)) {
  for (const rm of ['no-preference', 'reduce']) {
    const p = await openPage(url, { width: 1000, height: 700, media: [{ name: 'prefers-reduced-motion', value: rm }] });
    await p.eval(`document.getElementById('variant').textContent=${JSON.stringify(css + GUARD)}`);
    await sleep(300);
    console.log(`\n## ${name} / ${rm}`);
    console.log('t≈0.3s', JSON.stringify(summary(await p.eval(list))));
    if (rm === 'reduce') { await p.close(); continue; }
    // seek every animation to 5 s without pausing (a paused animation reports 'paused', never 'finished')
    const seek = await p.eval(`(()=>{const as=document.getAnimations();as.forEach(a=>a.currentTime=5000);
      const r={};as.forEach(a=>{r[a.playState]=(r[a.playState]||0)+1});return r})()`);
    console.log('seek 5000ms -> playState counts', JSON.stringify(seek), 'rest', JSON.stringify(await p.eval(rest)));
    await p.close();
    // real-time check on a fresh page
    const q = await openPage(url, { width: 1000, height: 700 });
    await q.eval(`document.getElementById('variant').textContent=${JSON.stringify(css + GUARD)}`);
    await sleep(5500);
    const all = await q.eval(list);
    console.log('real 5.5s -> running', all.filter((a) => a.state === 'running').length, 'of', all.length, 'rest', JSON.stringify(await q.eval(rest)));
    if (name === 'finite') {
      const b = await q.eval(`(()=>{const r=document.getElementById('title').getBoundingClientRect();return {x:r.x+20,y:r.y+r.height/2}})()`);
      await q.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y });
      await sleep(400);
      console.log('hover title +0.4s', JSON.stringify(summary((await q.eval(list)).filter((a) => a.state === 'running'))));
      const f = await q.eval(`(()=>{const r=document.getElementById('far').getBoundingClientRect();return {x:r.x+5,y:r.y+5}})()`);
      await q.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: f.x, y: f.y });
      await sleep(400);
      console.log('pointer away +0.4s', JSON.stringify(summary((await q.eval(list)).filter((a) => a.state === 'running'))));
      await sleep(4200);
      console.log('pointer away +4.6s running', (await q.eval(list)).filter((a) => a.state === 'running').length, 'rest', JSON.stringify(await q.eval(rest)));
    }
    await q.close();
  }
}
console.log('\ndone');
