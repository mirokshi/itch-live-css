// Focus every tabbable element programmatically (with keyboard modality) and record outline color, with/without CSS overrides.
import { openPage } from './cdp.mjs';
const [url] = process.argv.slice(2);
for (const [label, css] of [['none', ''], ['var', '#wrapper{--itchio_input_focus_color:#ffc857}'], ['fv-rule', '#wrapper a:focus-visible,#wrapper .button:focus-visible{outline:3px solid #ffc857;outline-offset:3px}']]) {
  const p = await openPage(url, { width: 1280 });
  if (css) await p.eval(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})()`);
  const tally = {};
  for (let i = 0; i < 40; i++) {
    for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const r = await p.eval(`(()=>{const a=document.activeElement;if(!a||a===document.body)return null;const c=getComputedStyle(a);
      return (a.closest('#wrapper')?'in':'out')+(a.classList.contains('button')?'.button':'')+' '+c.outlineStyle+' '+c.outlineColor})()`);
    if (r) tally[r] = (tally[r] || 0) + 1;
  }
  console.log(label.padEnd(8), JSON.stringify(tally));
  await p.close();
}
