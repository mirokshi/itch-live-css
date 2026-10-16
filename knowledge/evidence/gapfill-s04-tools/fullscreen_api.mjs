// s04-gf-14: the Fullscreen API path (itch's fullscreen_btn -> enter_fullscreen -> requestFullscreen on the iframe)
// puts the iframe in the top layer. Is it still trapped by a containing-block trigger on an ancestor?
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 node fullscreen_api.mjs <file URL of game_project.html>
import { openPage } from '../a11y-tests/cdp.mjs';
const [page] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [name, css] of Object.entries({ none: '', backdrop_inner: '#wrapper #inner_column{backdrop-filter:blur(8px)}',
  willchange_embed: '#wrapper .embed_wrapper{will-change:transform}' })) {
  const p = await openPage(page, { width: 1280, height: 800 });
  await p.eval(`document.getElementById('fix').textContent=${JSON.stringify(css)};1`);
  // load the iframe without maximizing: call itch's own load_frame() through the HtmlEmbed instance
  await p.eval(`new Promise(r=>I.HtmlEmbed.current.done(e=>{e.load_frame();r(1)}))`);
  await sleep(300);
  const res = await p.send('Runtime.evaluate', { expression: `document.querySelector('#game_drop').requestFullscreen().then(()=>'granted',e=>'refused: '+e.message)`, awaitPromise: true, userGesture: true, returnByValue: true });
  await sleep(500);
  const m = await p.eval(`(()=>{const i=document.querySelector('#game_drop');const r=i.getBoundingClientRect();
    return 'fullscreenElement='+(document.fullscreenElement&&document.fullscreenElement.id)+' iframe rect='+[r.left,r.top,r.width,r.height].map(Math.round)+' viewport='+innerWidth+'x'+innerHeight+' screen='+screen.width+'x'+screen.height})()`);
  console.log('FSAPI', name.padEnd(18), res.result.value, '|', m);
  await p.close();
}
