// s04-gf-08..12: does a containing-block trigger on an ancestor of the HTML5 game trap the "maximized" game frame?
// Real itch runtime: game_project.html (build_pages.py) keeps lib/bundle/game.min.js, so a real mouse click on
// "Run game" runs HtmlEmbed's load_iframe_btn handler -> enter_maximized() (the page is start_maximized), which adds
// .maximized to .game_frame and .frame_maximized to <body>. The game iframe (html-classic.itch.zone) is blocked.
// The game iframe points at the local fake_game.html (prints its own viewport size), so screenshots show what the game gets.
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 [SHOTS=<dir>] [ONLY=G12_x,G13_y] node maximize_r.mjs <file URL of game_project.html> [W ...]
// Retry-pass copy of maximize.mjs (same MEASURE) with four extra variants (G12-G15) and an ONLY filter.
import { openPage } from '../a11y-tests/cdp.mjs';
const [page, ...widths] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BLUR = 'backdrop-filter:blur(8px)';
const variants = {
  G0_none: '',
  G1_backdrop_inner: `#wrapper #inner_column{${BLUR}}`,
  G2_transform_viewpage: '#wrapper .view_game_page{transform:translateY(0)}',
  G3_entrance_anim_inner: '@keyframes rise{from{opacity:0;transform:translateY(16px)}}#wrapper #inner_column{animation:rise .4s ease-out both}',
  G4_filter_wrapper: '#wrapper{filter:saturate(1.2)}',
  G5_willchange_embed: '#wrapper .embed_wrapper{will-change:transform}',
  G6_pseudo_recipe: `#wrapper #inner_column{isolation:isolate}#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;${BLUR}}`,
  G7_has_guard: `#wrapper:not(:has(.html_embed_widget)) #inner_column{${BLUR}}`,
  G8_frame_maximized_guard: `#wrapper #inner_column{${BLUR}}body.frame_maximized #wrapper #inner_column{backdrop-filter:none}`,
  G9_control_opacity_isolation: '#wrapper #inner_column{opacity:.98;isolation:isolate}',
  G10_wrapper_isolation: '#wrapper{position:relative;isolation:isolate}',
  G11_pseudo_recipe_maxguard: `#wrapper #inner_column{isolation:isolate}#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;${BLUR}}` +
    'body.frame_maximized #wrapper #inner_column{isolation:auto}body.frame_maximized #wrapper #inner_column::before{content:none}',
  // retry pass: entrance animation WITHOUT a fill mode (measured ~1.3 s after load, i.e. after it ended)
  G12_entrance_no_fill: '@keyframes rise{from{opacity:0;transform:translateY(16px)}}#wrapper #inner_column{animation:rise .4s ease-out}',
  // retry pass: section 04 §9.5's isolated #wrapper, with the guard released while maximized
  G13_wrapper_isolation_maxguard: '#wrapper{position:relative;isolation:isolate}body.frame_maximized #wrapper{isolation:auto}',
  // retry pass: the same guard written entirely inside #wrapper (needs :has)
  G14_pseudo_recipe_hasguard: `#wrapper #inner_column{isolation:isolate}#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;${BLUR}}` +
    '#wrapper:has(.game_frame.maximized) #inner_column{isolation:auto}#wrapper:has(.game_frame.maximized) #inner_column::before{content:none}',
  // retry pass: 2D transform on the game frame's own wrapper element only while NOT maximized
  G15_hover_lift_embed_guarded: '#wrapper .embed_wrapper:not(:has(.maximized)){transform:translateY(0)}',
};
if (process.env.ONLY) for (const k of Object.keys(variants)) if (!process.env.ONLY.split(',').includes(k)) delete variants[k];
const MEASURE = `(()=>{const f=document.querySelector('.game_frame');const r=f.getBoundingClientRect();
  // visible part = frame rect intersected with every ancestor that clips (overflow != visible)
  // containing block of the fixed frame: nearest ancestor with a transform-like / filter / containment trigger
  const trig=c=>c.transform!=='none'||c.translate!=='none'||c.rotate!=='none'||c.scale!=='none'||c.filter!=='none'||
    c.backdropFilter!=='none'||c.perspective!=='none'||/transform|translate|rotate|scale|filter|perspective/.test(c.willChange)||
    /paint|layout|strict|content/.test(c.contain)||c.contentVisibility==='auto';
  let cb=null;for(let p=f.parentElement;p&&p!==document.documentElement;p=p.parentElement){if(trig(getComputedStyle(p))){cb=p;break;}}
  // a fixed element is clipped only by its containing block and that block's own clipping ancestors: elements between
  // the frame and the containing block do not clip it (CSS Overflow 3), and with no trigger nothing clips it
  let v={l:r.left,t:r.top,r:r.right,b:r.bottom};const clippers=[];
  for(let p=cb;p&&p!==document.documentElement;p=p.parentElement){const c=getComputedStyle(p);
    if(c.overflowX==='visible'&&c.overflowY==='visible')continue;const b=p.getBoundingClientRect();
    const nv={l:Math.max(v.l,b.left),t:Math.max(v.t,b.top),r:Math.min(v.r,b.right),b:Math.min(v.b,b.bottom)};
    if(nv.l>v.l+0.5||nv.t>v.t+0.5||nv.r<v.r-0.5||nv.b<v.b-0.5)clippers.push((p.id?'#'+p.id:'.'+p.classList[0])+'('+c.overflowX+')');v=nv;}
  const W=innerWidth,H=innerHeight;const vw=Math.max(0,Math.min(v.r,W)-Math.max(v.l,0)),vh=Math.max(0,Math.min(v.b,H)-Math.max(v.t,0));
  const pts=[[5,5],[W-5,5],[5,H-5],[W-5,H-5],[W/2,H/2]].map(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&f.contains(e)||e===f?'F':'-'});
  const ic=document.querySelector('#inner_column'),cs=getComputedStyle(ic);
  // z-order: does itch's #user_tools bar (outside #wrapper, z-index 2) paint over the maximized game?
  const ut=[...document.querySelectorAll('#user_tools a')].find(a=>a.getBoundingClientRect().width>0);let zo='-';
  if(ut){const q=ut.getBoundingClientRect(),e=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
    zo=e&&e.closest('#user_tools')?'user_tools-over-game':(e&&(f.contains(e)||e===f)?'game-over-user_tools':'other:'+(e&&e.tagName));}
  const cbName=cb?(cb.id?'#'+cb.id:'.'+cb.classList[0]):'viewport';
  return {zo,cbName,W,H,frameClass:f.className,bodyMax:document.body.classList.contains('frame_maximized'),
    rect:[r.left,r.top,r.width,r.height].map(Math.round).join(','),visible:Math.round(vw)+'x'+Math.round(vh),
    coverage:Math.round(100*vw*vh/(W*H))+'%',corners:pts.join(''),clippedBy:clippers.join(' ')||'-',
    innerBackdrop:cs.backdropFilter,innerTransform:cs.transform,innerBefore:getComputedStyle(ic,'::before').backdropFilter};})()`;

for (const w of (widths.length ? widths : ['1280', '600'])) {
  for (const [name, css] of Object.entries(variants)) {
    const p = await openPage(page, { width: +w, height: 800 });
    const errs = []; // note uncaught page errors (itch scripts on file://)
    await p.send('Runtime.enable');
    await p.eval(`document.getElementById('fix').textContent=${JSON.stringify(css)};1`);
    const ready = await p.eval(`typeof window.init_HtmlEmbed==='function'&&!!document.querySelector('.load_iframe_btn')`);
    const btn = await p.eval(`(()=>{const b=document.querySelector('.load_iframe_btn');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
    await sleep(700); // entrance animation (G3) finishes: .4s, fill both
    for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
    await sleep(600);
    const m = await p.eval(MEASURE);
    console.log(['MAX', 'W=' + w, name.padEnd(28), 'jsReady=' + ready, 'maximized=' + m.frameClass.includes('maximized') + '/' + m.bodyMax,
      'viewport=' + m.W + 'x' + m.H, 'containingBlock=' + m.cbName, 'rect=' + m.rect, 'visible=' + m.visible, 'coverage=' + m.coverage, 'corners+center=' + m.corners,
      'clippedBy=' + m.clippedBy, 'zOrder=' + m.zo, 'inner{backdrop:' + m.innerBackdrop + ';transform:' + m.innerTransform + ';::before backdrop:' + m.innerBefore + '}'].join(' | '));
    if (process.env.SHOTS) await p.shot(`${process.env.SHOTS}/max_${w}_${name}.png`);
    await p.close();
  }
}
