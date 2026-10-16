// Is the plain rename + prefix-selector call equivalent to the verified Bootstrap build? (gapfill-08)
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const postcss = require('postcss'); const rename = require('postcss-rename'); const prefixer = require('postcss-prefix-selector');
const src = fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.css'), 'utf8');
const { css } = await postcss([rename({ prefix: 'custom-' }), prefixer({ prefix: '#wrapper .custom-bs' })]).process(src, { from: undefined });
const ref = fs.readFileSync(process.argv[2], 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
console.log('identical:', norm(css) === norm(ref), css.length, ref.length);
fs.writeFileSync('bs-default.css', css);
