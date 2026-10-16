// Append candidate fixes at the END of style#jam_theme (where a host's CSS sits) and Tab through the page.
// usage: CDP_PORT=.. CDP_BLOCK_ITCH=1 node fixprobe.mjs <file-url> <maxStops>
import { openPage } from '../a11y-tests/cdp.mjs';
const [url, max = 160] = process.argv.slice(2);
const FIX = '#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}' +
  '#wrapper a:focus-visible,#wrapper button:focus-visible,#wrapper summary:focus-visible,#wrapper [tabindex]:focus-visible{outline:2px solid #ffc857;outline-offset:2px}';
for (const variant of ['asis', 'fix']) {
  const p = await openPage(url, { width: 1280, height: 900 });
  await new Promise(r => setTimeout(r, 1500));
  if (variant === 'fix') await p.eval(`document.getElementById('jam_theme').textContent += ${JSON.stringify(FIX)}; true`);
  let noRing = 0, hidden = 0, n = 0, first = null;
  for (let i = 0; i < +max; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await new Promise(r => setTimeout(r, 260));
    const s = await p.eval(`(() => { const a = document.activeElement; if (!a || a === document.body || a.tagName === 'IFRAME') return null;
      if (!a.closest('#wrapper')) return 'out';
      const cs = getComputedStyle(a); let op = 1; for (let x = a; x && x.nodeType === 1; x = x.parentElement) op *= +getComputedStyle(x).opacity;
      const r = a.getBoundingClientRect();
      return { k: a.tagName + (a.getAttribute('href') || '') + Math.round(r.y + scrollY) + ',' + Math.round(r.x), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none', op }; })()`);
    if (!s || s === 'out') continue;
    if (first === null) first = s.k; else if (s.k === first) break;
    n++; if (!s.ring) noRing++; if (s.op < 0.1) hidden++;
  }
  console.log(variant.padEnd(5), 'in-#wrapper stops', n, 'without ring', noRing, 'effectively invisible (opacity<0.1)', hidden);
  await p.close();
}
