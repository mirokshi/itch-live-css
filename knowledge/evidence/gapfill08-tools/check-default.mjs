// Is the plain postcss-prefix-selector call (no transform) equivalent to the verified tw3 recipe? (gapfill-08)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const postcss = require('postcss'); const prefixer = require('postcss-prefix-selector');
const tw3Dir = process.argv[2];
const tailwind3 = createRequire(path.join(tw3Dir, 'package.json'))('tailwindcss');
const cfg = { content: [path.join(tw3Dir, 'bio.html')], prefix: 'custom-', corePlugins: { preflight: false } };
const { css } = await postcss([tailwind3(cfg), prefixer({ prefix: '#wrapper' })])
  .process('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n', { from: path.join(tw3Dir, 'x.css') });
fs.writeFileSync('default.css', css);
const ref = fs.readFileSync(process.argv[3], 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
console.log('identical (whitespace-normalised):', norm(css) === norm(ref), css.length, ref.length);
