// Tab through a page; report each focused element, :focus-visible, outline, and .game_cell:hover-only effects.
import { openPage } from './cdp.mjs';
const [url, n = 12, shotPrefix] = process.argv.slice(2);
const p = await openPage(url, { width: 1280, height: 900 });
for (let i = 0; i < +n; i++) {
  await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await new Promise(r => setTimeout(r, 400));
  const info = await p.eval(`(() => { const a = document.activeElement; if (!a || a===document.body) return 'BODY';
    const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
    const cell = a.closest('.game_cell'); const ccs = cell && getComputedStyle(cell);
    return { tag: a.tagName, text: (a.textContent||'').trim().slice(0,30), inWrapper: !!a.closest('#wrapper'), fv: a.matches(':focus-visible'),
      outline: cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor, offset: cs.outlineOffset, opacity: getComputedStyle(a.closest('ul,div')||a).opacity,
      rect: [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],
      cellTransform: ccs ? ccs.transform : null, cellFocusWithin: cell ? cell.matches(':focus-within') : null };})()`);
  console.log(i + 1, JSON.stringify(info));
  if (shotPrefix && info.rect && info.inWrapper && i < 6) {
    const [x, y, w, h] = info.rect; await p.shot(`${shotPrefix}-${i + 1}.png`, { x: Math.max(0, x - 20), y: Math.max(0, y - 20), width: w + 40, height: h + 40 });
  }
}
await p.close();
