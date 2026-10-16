// Does the recommended jam focus-ring snippet (appended after the host CSS, inside style#jam_theme) reach
// links, header tabs, the submitter .button, spoilers and entry links? Keyboard Tab, so :focus-visible is real.
// usage: CDP_PORT=9612 CDP_BLOCK_ITCH=1 node ringfix.mjs <file-url> [maxStops]
import { openPage } from '../a11y-tests/cdp.mjs';
const [url, max = 160] = process.argv.slice(2);
const SNIP = '#wrapper a:focus-visible,#wrapper .button:focus-visible,#wrapper summary:focus-visible,' +
  '#wrapper .spoiler:focus-visible{outline:2px solid #ffc857;outline-offset:2px}' +
  '#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}';
for (const variant of ['asis', 'snippet']) {
  const p = await openPage(url, { width: 1280, height: 900 });
  await new Promise(r => setTimeout(r, 1200));
  if (variant === 'snippet') await p.eval(`document.getElementById('jam_theme').textContent += ${JSON.stringify(SNIP)}; true`);
  const kinds = {}; let first = null;
  for (let i = 0; i < +max; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await new Promise(r => setTimeout(r, 260));
    const s = await p.eval(`(() => { const a = document.activeElement; if (!a || a === document.body || a.tagName === 'IFRAME' || !a.closest('#wrapper')) return null;
      const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
      const kind = a.matches('.button') ? 'button' : a.matches('.header_tab') ? 'header_tab' : a.matches('.spoiler') ? 'spoiler'
        : a.closest('#entries') ? 'entry_link' : a.closest('.jam_header_widget') ? 'header_link' : 'content_link';
      return { k: a.tagName + (a.getAttribute('href') || '') + Math.round(r.y + scrollY) + ',' + Math.round(r.x), kind,
        ring: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor }; })()`);
    if (!s) continue;
    if (first === null) first = s.k; else if (s.k === first) break;
    const key = s.kind + ' -> ' + s.ring; kinds[key] = (kinds[key] || 0) + 1;
  }
  console.log(variant, JSON.stringify(kinds));
  await p.close();
}
