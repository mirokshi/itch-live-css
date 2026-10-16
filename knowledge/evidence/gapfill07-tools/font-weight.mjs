// Gap-fill 07 (2026-10-14): weight matching when a theme v1 <link> and a css2 @import declare the same family.
// Start Chrome:  chrome --headless=new --remote-debugging-port=9488 --user-data-dir=<scratch> about:blank
// Run:  CDP_PORT=9488 CDP_BLOCK_ITCH=1 node font-weight.mjs file:///<abs>/font-weight.html <shotDir>
// Only Google Fonts is contacted (no itch host).
import { openPage } from '../a11y-tests/cdp.mjs';
const [base, shotDir] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(qs, shot) {
  const p = await openPage(`${base}?${qs}`, { width: 900, height: 200 });
  await p.eval('document.fonts.ready.then(()=>1)');
  await sleep(600);
  const r = await p.eval(`(()=>{const e=document.getElementById('probe');const cs=getComputedStyle(e);
    const faces=[...document.fonts].filter(f=>/Syne/.test(f.family));
    return {fw:cs.fontWeight,width:+e.getBoundingClientRect().width.toFixed(1),
      loaded:faces.filter(f=>f.status==='loaded').map(f=>f.weight+(f.style==='italic'?'i':'')+':'+f.unicodeRange.slice(0,9)).join(' '),
      faces:faces.length}})()`);
  const doc = await p.send('DOM.getDocument', { depth: -1 });
  const n = await p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#probe' });
  const pf = await p.send('CSS.getPlatformFontsForNode', { nodeId: n.nodeId });
  r.platform = pf.fonts.map((f) => `${f.postScriptName || f.familyName}${f.isCustomFont ? '(web)' : '(local)'}×${f.glyphCount}`).join(' ');
  if (shot) await p.shot(`${shotDir}/${shot}.png`, { x: 0, y: 0, width: 900, height: 120 });
  await p.close();
  return r;
}

for (const mode of ['both', 'v1', 'css2']) {
  console.log(`\n## mode=${mode}`);
  for (const w of [400, 450, 500, 550, 600, 650, 700, 800]) console.log(`static w=${w}`, JSON.stringify(await probe(`mode=${mode}&w=${w}`)));
  for (const a of [0, 1, 1.5, 2.5, 3]) console.log(`anim t=${a}s (≙${400 + a * 100})`, JSON.stringify(await probe(`mode=${mode}&a=${a}`, (a === 1.5 || a === 2.5) ? `font-${mode}-${400 + a * 100}` : null)));
}
