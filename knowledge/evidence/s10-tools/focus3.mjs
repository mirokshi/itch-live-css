// s10-16: focus rings on itch's spoiler / .button / links with itch's real game.css, with and without fixes.
// usage: CDP_PORT=9481 node focus3.mjs <file-URL of s10-itchfocus.html> <file-URL of a local game.css copy>
import { openPage } from '../a11y-tests/cdp.mjs';
const [page, gameCss] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const variants = {
  none: '',
  varOnly: '#wrapper{--itchio_input_focus_color:#ffc857}',
  fixes: '#wrapper{--itchio_input_focus_color:#ffc857}' +
    '#wrapper .button:focus-visible,#wrapper .spoiler:focus-visible{outline:2px solid #ffc857;outline-offset:2px}',
};
for (const [name, css] of Object.entries(variants)) {
  const p = await openPage(page, { width: 900, height: 500 });
  await p.eval(`(async()=>{const l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(gameCss)};
    document.head.insertBefore(l,document.getElementById('fix'));await new Promise(r=>{l.onload=r;l.onerror=r});
    document.getElementById('fix').textContent=${JSON.stringify(css)};})()`);
  await sleep(300);
  const out = [];
  for (let i = 0; i < 3; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(250);
    out.push(await p.eval(`(()=>{const a=document.activeElement,c=getComputedStyle(a);
      return a.id+': '+c.outlineStyle+' '+c.outlineWidth+' '+c.outlineColor+' fv='+a.matches(':focus-visible')})()`));
  }
  const sheetOk = await p.eval(`[...document.styleSheets].some(s=>{try{return s.href&&s.href.includes('game')&&s.cssRules.length>100}catch(e){return false}})`);
  console.log('FOCUS3', name.padEnd(8), 'game.css loaded=' + sheetOk, '|', out.join(' | '));
  await p.close();
}
