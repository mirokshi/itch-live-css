// s04-gf-13: does the "frosted panel" pseudo-element recipe actually blur what is behind the project column?
// game_project.html, no click. #wrapper gets a 2px black/white stripe background-image (longhand), the column's BG2
// is made transparent, and an empty 120px spacer is inserted at the top of #inner_column. The spacer region is then
// screenshotted and its pixels summarised: crisp stripes => min 0 / max 255; a blur => values collapse toward grey.
// usage: CDP_PORT=9488 CDP_BLOCK_ITCH=1 node blur_check.mjs <file URL of game_project.html> <out dir>
import { openPage } from '../a11y-tests/cdp.mjs';
import fs from 'node:fs'; import zlib from 'node:zlib';
const [page, outDir] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = '#wrapper{background-image:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 4px)}#wrapper #inner_column{background-color:transparent}';
const variants = {
  B0_no_blur: BASE,
  B1_backdrop_on_column: BASE + '#wrapper #inner_column{backdrop-filter:blur(8px)}',
  B2_pseudo_recipe: BASE + '#wrapper #inner_column{isolation:isolate}#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;backdrop-filter:blur(8px)}',
  B3_pseudo_no_isolation: BASE + '#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;backdrop-filter:blur(8px)}',
};
function stats(file) { // minimal PNG decode (8-bit RGB/RGBA, non-interlaced), as in a11y-tests/pngstat.mjs
  const b = fs.readFileSync(file); let p = 8, W, H, ct; const idat = [];
  while (p < b.length) { const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); ct = d[9]; } else if (type === 'IDAT') idat.push(d); p += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), st = W * bpp, px = Buffer.alloc(H * st);
  for (let y = 0; y < H; y++) { const f = raw[y * (st + 1)], s = raw.subarray(y * (st + 1) + 1, (y + 1) * (st + 1));
    for (let i = 0; i < st; i++) { const a = i >= bpp ? px[y * st + i - bpp] : 0, up = y ? px[(y - 1) * st + i] : 0, c = (y && i >= bpp) ? px[(y - 1) * st + i - bpp] : 0; let v = s[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1; else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? up : c); }
      px[y * st + i] = v & 255; } }
  let mn = 255, mx = 0, sum = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = px[y * st + x * bpp]; mn = Math.min(mn, v); mx = Math.max(mx, v); sum += v; n++; }
  return `R min ${mn} max ${mx} mean ${Math.round(sum / n)}`;
}
for (const [name, css] of Object.entries(variants)) {
  const p = await openPage(page, { width: 1280, height: 800 });
  await p.eval(`(()=>{const d=document.createElement('div');d.id='spacer';d.style.height='120px';
    const ic=document.querySelector('#inner_column');ic.insertBefore(d,ic.firstChild);
    document.getElementById('fix').textContent=${JSON.stringify(css)};})()`);
  await sleep(500);
  const clip = await p.eval(`(()=>{const r=document.getElementById('spacer').getBoundingClientRect();return {x:r.left+40+scrollX,y:r.top+20+scrollY,width:200,height:60}})()`);
  const f = `${outDir}/blur_${name}.png`;
  await p.shot(f, clip);
  const outside = `${outDir}/blur_${name}_outside.png`;
  await p.shot(outside, { x: 20, y: clip.y, width: 100, height: 60 });
  console.log('BLUR', name.padEnd(24), 'inside column:', stats(f), '| outside column:', stats(outside));
  await p.close();
}
