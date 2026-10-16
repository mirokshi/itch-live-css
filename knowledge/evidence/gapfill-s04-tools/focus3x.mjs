// s04 gap-fill retry (s04-gf-R1): s10's focus3.mjs re-run against all three itch bundles (user.css, game.css,
// jam.css) on focus3x.html, which adds a profile collection link + carousel card and a jam grid card to the
// s10 page. Tabs through every stop and prints the focused element's computed ring, the card ring (outline of the
// closest .game_cell, or a ::after border overlay), and the effective opacity (hover-only cell tools).
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 node focus3x.mjs <file URL of focus3x.html> <dir file URL holding user/game/jam.css>
import { openPage } from '../a11y-tests/cdp.mjs';
const [page, cssDir] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const G = '#ffc857';
const variants = {
  none: '',
  s04_outlineColor: `#wrapper :focus{outline-color:${G}}`,
  s06_isAButton: `#wrapper :is(a,.button):focus-visible{outline:3px solid ${G};outline-offset:3px}`,
  s10_fixes: `#wrapper{--itchio_input_focus_color:${G}}` +
    `#wrapper .button:focus-visible,#wrapper .spoiler:focus-visible{outline:2px solid ${G};outline-offset:2px}` +
    `#wrapper .game_cell:has(:focus-visible){outline:3px solid ${G};outline-offset:3px}`,
  canonical: `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
    `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
    `#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}` +
    `#wrapper .game_cell{position:relative}` +
    `#wrapper .game_cell:has(:focus-visible)::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border:3px solid var(--focus-ring);border-radius:inherit}` +
    `#wrapper .game_cell:has(:focus-visible) .game_cell_tools{opacity:1}`,
};
const bundles = { user: 'user_page_wrap', game: 'main wrapper game_page_wrapper', jam: 'jam_page_wrap' };
for (const [bundle, wrapClass] of Object.entries(bundles)) {
  for (const [name, css] of Object.entries(variants)) {
    const p = await openPage(page, { width: 900, height: 700 });
    const loaded = await p.eval(`(async()=>{document.getElementById('wrapper').className=${JSON.stringify(wrapClass)};
      const l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(cssDir + bundle + '.css')};
      document.head.insertBefore(l,document.getElementById('fix'));await new Promise(r=>{l.onload=r;l.onerror=r});
      document.getElementById('fix').textContent=${JSON.stringify(css)};
      const n=document.createElement('style');n.textContent='#wrapper *{transition:none!important}';document.head.appendChild(n);
      return [...document.styleSheets].some(s=>{try{return s.href&&s.href.endsWith(${JSON.stringify(bundle + '.css')})&&s.cssRules.length>100}catch(e){return false}})})()`);
    await sleep(200);
    const out = [];
    for (let i = 0; i < 12; i++) {
      for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await sleep(60);
      const r = await p.eval(`(()=>{const a=document.activeElement;if(!a||a===document.body||!a.id)return null;const c=getComputedStyle(a);
        let op=1;for(let e=a;e;e=e.parentElement)op*=parseFloat(getComputedStyle(e).opacity);
        const cell=a.closest('.game_cell');let card='';
        if(cell){const o=getComputedStyle(cell),af=getComputedStyle(cell,'::after');
          card=' card='+(o.outlineStyle!=='none'?o.outlineStyle+' '+o.outlineWidth+' off'+o.outlineOffset:(af.content!=='none'&&af.borderTopStyle!=='none'?'::after '+af.borderTopWidth:'none'));}
        const sc=a.closest('.carousel_wrapper,.game_title');const clipper=sc?' in:'+sc.className.split(' ')[0]+'('+getComputedStyle(sc).overflowX+')':'';
        return a.id+'='+c.outlineStyle+' '+c.outlineWidth+' '+c.outlineColor.replace('rgb','')+' off'+c.outlineOffset+' fv='+a.matches(':focus-visible')+(op<1?' opacity='+op:'')+card+clipper})()`);
      if (r && !out.includes(r)) out.push(r);
    }
    console.log('FOCUS3X', bundle, name.padEnd(16), 'bundle loaded=' + loaded);
    for (const r of out) console.log('   ', r);
    await p.close();
  }
}
