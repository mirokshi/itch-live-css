// ring-shots.mjs <raw dir> <out dir> - devlog post with itch's JS (lr.mjs): Tab to the banner link and to the footer
// breadcrumb links, with the project template minus / plus its inset-ring rule, and save a clipped screenshot of
// each focused link (8 px margin). Usage: CDP_PORT=… LR_MIRROR=… LR_RAW=… LR_NEW_IMAGES=placeholder node ring-shots.mjs <raw> <out>
import fs from 'node:fs';
import path from 'node:path';
import { open } from './lr.mjs';
const [RAWDIR, OUT] = process.argv.slice(2);
const T = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'templates');
const full = fs.readFileSync(path.join(T, 'project.min.css'), 'utf8').trim();
const inset = '#wrapper .header a:focus-visible,#wrapper .breadcrumbs a:focus-visible{outline-offset:-2px}';
if (!full.includes(inset)) throw new Error('template no longer contains the inset rule');
const doc = { url: 'https://orama-interactive.itch.io/pixelorama/devlog/1664980/pixelorama-v123-is-out-bugfix-update', snapshot: path.join(RAWDIR, 'live-orama_interactive_itch_io_pixelorama_devlog_1664980_pixelorama_v123_is_out_bugfix_update.html') };
const targets = [['banner', '#header > a'], ['crumb1', '.footer .breadcrumbs a:nth-of-type(1)'], ['crumb2', '.footer .breadcrumbs a:nth-of-type(2)']];
const res = {};
for (const [variant, css] of [['without-inset', full.replace(inset, '')], ['with-inset', full]]) {
  const p = await open({ ...doc, inject: { mode: 'custom_css', css } }, { width: 1280, height: 900 });
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  for (const [name, sel] of targets) {
    await p.eval('document.activeElement && document.activeElement.blur(); true');
    let hit = false;
    for (let i = 0; i < 200 && !hit; i++) {
      for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      hit = await p.eval(`document.activeElement === document.querySelector(${JSON.stringify(sel)})`);
    }
    const box = await p.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); const t = e.children[0] || e; const r = (e.getBoundingClientRect().height ? e : t).getBoundingClientRect(); const c = getComputedStyle(e); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, fv: e.matches(':focus-visible'), outline: c.outlineStyle + ' ' + c.outlineWidth + ' off ' + c.outlineOffset }; })()`);
    const file = path.join(OUT, `ring-${variant}-${name}.png`);
    const m = 8;
    await p.shot(file, { x: Math.max(0, box.x - m), y: Math.max(0, box.y - m), width: Math.min(box.w + 2 * m, 700), height: Math.min(box.h + 2 * m, 300) });
    res[`${variant} ${name}`] = { reached: hit, ...box, file: path.basename(file) };
  }
  await p.close();
}
console.log(JSON.stringify(res, null, 1));
