// Framework builds for the itch lab (gapfill-08, 2026-10-14).
// usage (from the bs/ dir, which holds bootstrap + postcss + postcss-rename + postcss-prefix-selector):
//   node build-fw.mjs <tw3_dir> <tw4_out_dir> <out_dir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const rename = require('postcss-rename');
const prefixer = require('postcss-prefix-selector');
const [tw3Dir, tw4Out, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const write = (n, css) => { fs.writeFileSync(path.join(outDir, n), css); return css; };
const size = (css) => ({ raw: Buffer.byteLength(css), gzip: zlib.gzipSync(css, { level: 9 }).length,
  br: zlib.brotliCompressSync(Buffer.from(css), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length });
const nestedInRule = (rule) => { for (let p = rule.parent; p; p = p.parent) if (p.type === 'rule') return true; return false; };
const inKeyframes = (rule) => { for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true; return false; };
// prefix every top-level selector; global roots (:root, html, body) become the prefix itself (plugin default);
// nested rules (CSS nesting, Tailwind v4 output) and keyframe selectors are left alone.
const scope = (prefix) => prefixer({ prefix, transform(pfx, sel, prefixed, file, rule) {
  if (nestedInRule(rule) || inKeyframes(rule)) return sel;
  if (/^(:root|html|body|:host)$/.test(sel)) return pfx;
  return prefixed;
} });
const minify = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').trim();
const sizes = {};
const minOf = (n, css) => { sizes[n] = size(minify(css)); write(n.replace(/\.css$/, '.min.css'), minify(css)); };

// ---------- Bootstrap 5.3.3 ----------
const bsSrc = fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.css'), 'utf8');
const bsMin = fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.min.css'), 'utf8');
write('bs-asis.css', bsMin); sizes['bs-asis.css'] = size(bsMin);
let renameMap = {};
const bsWrapper = (await postcss([rename({ prefix: 'custom-', outputMapCallback: (m) => { renameMap = m; } }), scope('#wrapper')])
  .process(bsSrc, { from: undefined })).css;
write('bs-wrapper.css', bsWrapper); minOf('bs-wrapper.css', bsWrapper);
const bsBio = (await postcss([rename({ prefix: 'custom-' }), scope('#wrapper .custom-bs')]).process(bsSrc, { from: undefined })).css;
write('bs-bio.css', bsBio); minOf('bs-bio.css', bsBio);
fs.writeFileSync(path.join(outDir, 'bs-rename-map.json'), JSON.stringify(renameMap, null, 0));

// ---------- Tailwind v3.4 recipe: prefix custom-, preflight off, NO `important`, then scope with #wrapper ----------
const tw3req = createRequire(path.join(tw3Dir, 'package.json'));
const tailwind3 = tw3req('tailwindcss');
const tw3cfg = { content: [path.join(tw3Dir, 'bio.html')], prefix: 'custom-', corePlugins: { preflight: false } };
const tw3In = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
const tw3Recipe = (await postcss([tailwind3(tw3cfg), scope('#wrapper')]).process(tw3In, { from: path.join(tw3Dir, 'x.css') })).css;
write('tw3-recipe.css', tw3Recipe); minOf('tw3-recipe.css', tw3Recipe);
for (const n of ['out-full.css', 'out-util.css']) { const c = fs.readFileSync(path.join(tw3Dir, n), 'utf8'); write('tw3-' + n, c); minOf('tw3-' + n, c); }

// ---------- Tailwind v4.1 recipe: theme(inline) + prefix(custom) + important, then scope + rename keyframes ----------
const tw4b = fs.readFileSync(path.join(tw4Out, 'b-theme-util.css'), 'utf8');
write('tw4-b-theme-util.css', tw4b); minOf('tw4-b-theme-util.css', tw4b);
const tw4g = fs.readFileSync(path.join(tw4Out, 'g-recipe-raw.css'), 'utf8');
let tw4Recipe = (await postcss([scope('#wrapper')]).process(tw4g, { from: undefined })).css;
const kf = [...tw4Recipe.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]).filter((n) => !n.startsWith('custom-'));
for (const n of kf) {
  tw4Recipe = tw4Recipe.replace(new RegExp(`@keyframes\\s+${n}\\b`, 'g'), `@keyframes custom-${n}`)
    .replace(new RegExp(`(animation(?:-name)?:\\s*)${n}\\b`, 'g'), `$1custom-${n}`)
    .replace(new RegExp(`(--custom-animate-[\\w-]+:\\s*)${n}\\b`, 'g'), `$1custom-${n}`);
}
write('tw4-recipe.css', tw4Recipe); minOf('tw4-recipe.css', tw4Recipe);
console.log(JSON.stringify({ sizes, renamedClasses: Object.keys(renameMap).length, tw4KeyframesRenamed: kf }, null, 1));
