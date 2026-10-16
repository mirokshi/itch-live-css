// Focus every focusable inside #wrapper via script (focus-visible forced by keyboard-like focus) and report outline colors with/without a #wrapper variable override.
import { openPage } from './cdp.mjs';
const [url] = process.argv.slice(2);
for (const css of ['', '#wrapper{--itchio_input_focus_color:#ffc857}']) {
  const p = await openPage(url, { width: 1280, height: 900 });
  if (css) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})()`);
  const out = {};
  for (let i = 0; i < 25; i++) {
    for (const type of ['keyDown','keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await new Promise(r => setTimeout(r, 120));
    const r = await p.eval(`(()=>{const a=document.activeElement;if(!a||a===document.body)return null;const cs=getComputedStyle(a);return {k:(a.classList.contains('button')?'button':a.tagName)+(a.closest('#wrapper')?'':'(outside)'), o:cs.outlineStyle+' '+cs.outlineColor}})()`);
    if (r) { const key = r.k + ' -> ' + r.o; out[key] = (out[key] || 0) + 1; }
  }
  console.log(css || 'default', JSON.stringify(out));
  await p.close();
}
