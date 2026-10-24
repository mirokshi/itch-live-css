#!/usr/bin/env node
// node bin/cli.js measure <file.css> <profile|project|jam>: the CSS's size as itch stores it, against
// that page type's cap. Exit code 1 when itch would refuse it.

import { readFileSync } from 'node:fs';
import { measure } from '../src/index.js';

const [cmd, file, page] = process.argv.slice(2);
if (cmd !== 'measure' || !file || !page) {
  console.error('usage: node bin/cli.js measure <file.css> <profile|project|jam>');
  process.exit(2);
}
try {
  const { chars, bytes, limit, fits } = measure(readFileSync(file, 'utf8'), page);
  const cap = limit ? ` of ${limit.max} ${limit.unit}${limit.exact ? '' : ' known to save'}` : '';
  const verdict = !limit ? 'no cap' : fits ? 'fits' : fits === false ? 'too big: itch refuses the save' : 'unknown: past the largest size known to save';
  console.log(`${page}: ${chars} characters, ${bytes} bytes${cap} → ${verdict}`);
  process.exitCode = fits === false ? 1 : 0;
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
