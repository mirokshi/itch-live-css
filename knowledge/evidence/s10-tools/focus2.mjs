// Mouse click vs keyboard Tab: which card-level focus selectors match? (s10-04b)
import { openPage } from '../a11y-tests/cdp.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = `(()=>{const c=document.getElementById('cellA');return 'active='+document.activeElement.id+' focus-within='+c.matches(':focus-within')+' has(:focus-visible)='+c.matches(':has(:focus-visible)')})()`;
let p = await openPage(process.argv[2], { width: 900, height: 500 });
const b = await p.eval(`(()=>{const r=document.getElementById('linkA').getBoundingClientRect();return {x:r.x+5,y:r.y+r.height/2}})()`);
for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
await sleep(400); console.log('mouse click:', await p.eval(probe)); await p.close();
p = await openPage(process.argv[2], { width: 900, height: 500 });
for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await sleep(400); console.log('keyboard Tab:', await p.eval(probe)); await p.close();
