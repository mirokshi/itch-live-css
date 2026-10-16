// s04-gf-01..05: which focus recipe gives every keyboard stop inside #wrapper a visible, unclipped ring,
// on real profile (user.css), jam overview (jam.css) and project (game.css) markup.
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 [W=1280] node focus_matrix.mjs <pages dir (file URL, trailing slash)> [variant ...]
// A measurement-only <style> turns transitions off inside #wrapper (jam header tabs use transition:all .2s and the
// card tools fade in over .2s), so every reading is the settled end state. After the Tab walk, one mouse click on the
// first .game_cell title link checks whether the card ring also appears for pointer focus.
// Pages come from build_pages.py. Every variant's CSS goes into <style id="fix"> (the custom_css slot).
import { openPage } from '../a11y-tests/cdp.mjs';
const [base, ...only] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const G = '#ffc857';
export const variants = {
  V0_none: '',
  V1_s04_outlineColor: `#wrapper :focus{outline-color:${G}}`,
  V2_s06_isAButton: `#wrapper :is(a,.button):focus-visible{outline:3px solid ${G};outline-offset:3px}`,
  V3_s07_focusWithin: `#wrapper a:focus-visible{outline:3px solid ${G};outline-offset:3px}` +
    `#wrapper .game_cell:focus-within{outline:3px solid ${G};outline-offset:3px}`,
  V4_s10_block: `#wrapper{--itchio_input_focus_color:${G}}` +
    `#wrapper .button:focus-visible,#wrapper .spoiler:focus-visible{outline:2px solid ${G};outline-offset:2px}` +
    `#wrapper .game_cell:has(:focus-visible){outline:3px solid ${G};outline-offset:3px}`,
  V5_canonical: `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
    `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
    `#wrapper .game_cell :focus-visible{outline-offset:-2px}` +
    `#wrapper .game_cell:has(:focus-visible){outline:3px solid var(--focus-ring);outline-offset:3px}` +
    `#wrapper .carousel_wrapper .game_cell:has(:focus-visible){outline-offset:-3px}` +
    `#wrapper .game_cell:has(:focus-visible) .game_cell_tools{opacity:1}`,
  // V6 = the block published in section 04 §9.6: inset rings wherever itch clips (cards, scrollers)
  V6_published: `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
    `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
    `#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}` +
    `#wrapper .game_cell:has(:focus-visible){outline:3px solid var(--focus-ring);outline-offset:-3px}` +
    `#wrapper .game_cell:has(:focus-visible) .game_cell_tools{opacity:1}`,
  // V7 = V6 with the card ring drawn as a ::after overlay: never clipped by itch's scrollers and painted above the
  // position:relative .game_thumb (an inset outline is hidden under the thumbnail; see focus_shots.mjs)
  V7_overlay: `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
    `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
    `#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}` +
    `#wrapper .game_cell{position:relative}` +
    `#wrapper .game_cell:has(:focus-visible)::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border:3px solid var(--focus-ring);border-radius:inherit}` +
    `#wrapper .game_cell:has(:focus-visible) .game_cell_tools{opacity:1}`,
  // V8 = the block finally published in section 04 §9.6 (retry pass): V7 with the cell tools revealed by
  // :focus-within (no :has() dependency for that part; same selector as section 01's verified jam fix)
  V8_final: `#wrapper{--focus-ring:${G};--itchio_input_focus_color:var(--focus-ring)}` +
    `#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}` +
    `#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}` +
    `#wrapper .game_cell{position:relative}` +
    `#wrapper .game_cell:has(:focus-visible)::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border:3px solid var(--focus-ring);border-radius:inherit}` +
    `#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}`,
  // V9 = section 01's jam snippet (gapfill01-13), for comparison (retry pass)
  V9_s01_jam: `#wrapper a:focus-visible,#wrapper .button:focus-visible,#wrapper summary:focus-visible,` +
    `#wrapper .spoiler:focus-visible{outline:2px solid ${G};outline-offset:2px}` +
    `#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}`,
};
const pages = (process.env.PAGES_ONLY || 'focus_profile.html,focus_jam.html,focus_project.html').split(',');

// In-page probe: classify the focused element, read its ring and the card ring, and measure clipping by
// every ancestor whose computed overflow is not visible (ring box = border box inflated by offset + width).
const PROBE = `(()=>{
const a=document.activeElement; if(!a||a===document.body) return null;
const inW=!!a.closest('#wrapper');
const desc=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.classList.length?'.'+[...e.classList].slice(0,3).join('.'):'');
const cat=a.matches('.spoiler')?'spoiler':a.matches('.button.disabled')?'button-disabled':a.closest('.game_cell_tools')?'cell-tools':a.closest('.game_cell .game_title')?'cell-title':
 a.closest('.game_cell .game_author')?'cell-author':a.closest('.game_cell')?'cell-other':a.closest('.collection_row h2')?'collection-h2':
 a.matches('.button,.button *')||a.closest('.button')?'button':a.closest('.user_profile,.formatted_description,.jam_content')?'content-link':
 a.closest('.user_links')?'user-links':'other:'+desc(a);
function ring(el){const c=getComputedStyle(el);return {s:c.outlineStyle,w:parseFloat(c.outlineWidth),o:parseFloat(c.outlineOffset),c:c.outlineColor};}
function clip(el,r){ if(r.s==='none'||r.w===0) return 'no-ring';
 const rs=[...el.getClientRects()].filter(x=>x.width||x.height); if(!rs.length) return 'no-box';
 const e=r.w+r.o; let L=Math.min(...rs.map(x=>x.left))-e,T=Math.min(...rs.map(x=>x.top))-e,R=Math.max(...rs.map(x=>x.right))+e,B=Math.max(...rs.map(x=>x.bottom))+e;
 const out=[];
 for(let p=el.parentElement;p&&p!==document.documentElement;p=p.parentElement){const c=getComputedStyle(p);
  if(c.overflowX==='visible'&&c.overflowY==='visible') continue; const b=p.getBoundingClientRect();
  const box={l:b.left+parseFloat(c.borderLeftWidth),t:b.top+parseFloat(c.borderTopWidth),r:b.right-parseFloat(c.borderRightWidth),b:b.bottom-parseFloat(c.borderBottomWidth)};
  const k={}; if(c.overflowY!=='visible'){k.t=Math.max(0,box.t-T);k.b=Math.max(0,B-box.b);} if(c.overflowX!=='visible'){k.l=Math.max(0,box.l-L);k.r=Math.max(0,R-box.r);}
  // a side where the element's own border box is already outside the scrollport = scrolled out, not a ring cut
  const raw={t:box.t-(T+e),b:(B-e)-box.b,l:box.l-(L+e),r:(R-e)-box.r};
  const cut=Object.entries(k).filter(([s,v])=>v>0.5&&raw[s]<=0.5).map(([s,v])=>s+Math.round(v));
  const scr=Object.entries(k).filter(([s,v])=>v>0.5&&raw[s]>0.5).map(([s,v])=>s);
  if(cut.length) out.push(desc(p)+'('+c.overflowX+'/'+c.overflowY+'):'+cut.join(','));
  else if(scr.length) out.push('SCROLLED-OUT '+desc(p)+':'+scr.join(','));}
 const real=out.filter(x=>!x.startsWith('SCROLLED-OUT'));
 return real.length?'CLIPPED '+real.join(' ; '):out.length?'whole (part '+out.join(' ; ')+')':'whole';}
let opacity=1; for(let p=a;p&&p!==document.documentElement;p=p.parentElement) opacity*=parseFloat(getComputedStyle(p).opacity);
const r=ring(a); const cell=a.closest('.game_cell'); let card=null;
if(cell){let cr=ring(cell); const af=getComputedStyle(cell,'::after');
 // overlay ring (V7): an absolutely positioned ::after border inside the card box counts as an inset ring
 if(cr.s==='none'&&af.content!=='none'&&af.position==='absolute'&&af.borderTopStyle!=='none'){const bw=parseFloat(af.borderTopWidth);cr={s:'after-border-'+af.borderTopStyle,w:bw,o:-bw,c:af.borderTopColor+' z'+af.zIndex};}
 card=cr.s+' '+cr.w+' '+cr.c+' off'+cr.o+' -> '+clip(cell,cr);}
return {inW,cat,el:desc(a),fv:a.matches(':focus-visible'),ring:r.s+' '+r.w+' '+r.c+' off'+r.o,ringClip:clip(a,r),opacity:+opacity.toFixed(2),card};
})()`;

const tabs = async (p, n) => {
  const seen = new Map(); const sum = new Map(); let inside = false, steps = 0, stops = 0;
  const bump = (k) => sum.set(k, (sum.get(k) || 0) + 1);
  for (let i = 0; i < n; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(15); steps++;
    const s = await p.eval(PROBE);
    if (!s) continue;
    if (s.inW) inside = true; else if (inside) break; // left #wrapper again: done
    if (!s.inW) continue;
    stops++;
    if (s.ringClip === 'no-ring') bump('NO-RING ' + s.cat);
    if (s.ringClip.startsWith('CLIPPED')) bump('RING ' + s.ringClip.replace(/:[tblr0-9,]+/g, ''));
    if (s.ringClip.startsWith('whole (part')) bump('scrolled-out ring (not cut)');
    if (s.card && s.card.includes('-> whole (part')) bump('scrolled-out card (not cut)');
    if (s.card && s.card.includes('CLIPPED')) bump('CARD ' + s.card.split('-> ')[1].replace(/:[tblr0-9,]+/g, ''));
    if (s.opacity < 0.1) bump('INVISIBLE ' + s.cat);
    const list = seen.get(s.cat) || []; if (list.length < 2) { list.push(s); seen.set(s.cat, list); }
  }
  return { seen, steps, sum, stops };
};

for (const [vname, css] of Object.entries(variants)) {
  if (only.length && !only.includes(vname)) continue;
  for (const page of pages) {
    const p = await openPage(base + page, { width: +(process.env.W || 1280), height: 900 });
    await p.eval(`document.getElementById('fix').textContent=${JSON.stringify(css)};
      const n=document.createElement('style');n.id='notrans';n.textContent='#wrapper *,#wrapper *::before,#wrapper *::after{transition:none!important}';
      document.head.appendChild(n);document.addEventListener('click',e=>e.preventDefault(),true);document.body.offsetWidth`);
    await sleep(100);
    const { seen, steps, sum, stops } = await tabs(p, 400);
    console.log('CLIPSUM', vname, page, 'stops=' + stops, [...sum].map(([k, v]) => k + ' x' + v).join(' ; ') || 'all stops ringed, unclipped, visible');
    for (const [cat, list] of seen) for (const s of list)
      console.log(['FOCUS', vname, page.replace('focus_', '').replace('.html', ''), cat.padEnd(13), s.el.slice(0, 40).padEnd(40),
        'fv=' + s.fv, 'ring=' + s.ring, s.ringClip, 'opacity=' + s.opacity, s.card ? 'CARD=' + s.card : ''].join(' | '));
    console.log('STEPS', vname, page, steps);
    // pointer focus: click the first card title (navigation is prevented); is the card ring shown?
    const pt = await p.eval(`(()=>{document.activeElement&&document.activeElement.blur();const a=document.querySelector('#wrapper .game_cell .game_title a');
      if(!a) return null;a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.left+Math.min(10,r.width/2),y:r.top+r.height/2}})()`);
    if (pt) {
      for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await sleep(50);
      const c = await p.eval(`(()=>{const a=document.activeElement,cell=a.closest('.game_cell'),c=cell&&getComputedStyle(cell);
        const af=cell&&getComputedStyle(cell,'::after');
        return a.className+' fv='+a.matches(':focus-visible')+' card='+(c?c.outlineStyle+' '+c.outlineWidth:'-')+' overlay='+(af?af.content+'/'+af.borderTopStyle:'-')})()`);
      console.log('CLICK', vname, page, c);
    }
    await p.close();
  }
}
