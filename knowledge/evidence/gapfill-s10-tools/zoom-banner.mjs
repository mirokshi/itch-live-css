// zoom-banner.mjs <raw dir> <out dir> <project.min.css> - 8x capture of the top-left corner of the devlog banner link
// while it has keyboard focus, without and with the inset-ring rule (s10-26). Same env as ring-shots.mjs.
import fs from 'node:fs'; import path from 'node:path';
import { open } from './lr.mjs';
const [RAW, OUT, cssFile] = process.argv.slice(2);
const full = fs.readFileSync(cssFile, 'utf8').trim();
const inset = '#wrapper .header a:focus-visible,#wrapper .breadcrumbs a:focus-visible{outline-offset:-2px}';
const doc = { url: 'https://orama-interactive.itch.io/pixelorama/devlog/1664980/pixelorama-v123-is-out-bugfix-update', snapshot: path.join(RAW, 'live-orama_interactive_itch_io_pixelorama_devlog_1664980_pixelorama_v123_is_out_bugfix_update.html') };
for (const [v, css] of [['without', full.replace(inset, '')], ['with', full]]) {
  const p = await open({ ...doc, inject: { mode: 'custom_css', css } }, { width: 1280, height: 900 });
  await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  let hit = false;
  for (let i = 0; i < 60 && !hit; i++) { for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }); hit = await p.eval('document.activeElement === document.querySelector("#header > a")'); }
  await p.eval('scrollTo(0,0); true');
  const r = await p.eval('(() => { const b = document.querySelector("#header > a > img").getBoundingClientRect(); const h = document.querySelector("#header").getBoundingClientRect(); return { img: [b.left, b.top, b.width, b.height], header: [h.left, h.top, h.width, h.height] }; })()');
  const shot = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: r.img[0] - 6, y: r.img[1], width: 30, height: 30, scale: 8 } });
  fs.writeFileSync(path.join(OUT, `zoom-banner-${v}.png`), Buffer.from(shot.data, 'base64'));
  console.log(v, 'reached', hit, JSON.stringify(r));
  await p.close();
}
