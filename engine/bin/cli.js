#!/usr/bin/env node
// node bin/cli.js measure <file.css> <profile|project|jam>: the CSS's size as itch stores it, against
//   that page type's cap. Exit code 1 when itch would refuse it.
// node bin/cli.js validate <file.css> <profile|project|jam> [--served]: the knowledge base's rules
//   (R ids). --served: the file comes through @import, so the cap doesn't apply. Exit code 1 on errors.

import { readFileSync } from 'node:fs';
import { measure, validate } from '../src/index.js';

const [cmd, file, page, flag] = process.argv.slice(2);
if (!['measure', 'validate'].includes(cmd) || !file || !page) {
  console.error('usage: node bin/cli.js measure <file.css> <profile|project|jam>');
  console.error('       node bin/cli.js validate <file.css> <profile|project|jam> [--served]');
  process.exit(2);
}
try {
  const css = readFileSync(file, 'utf8');
  if (cmd === 'measure') {
    const { chars, bytes, limit, fits } = measure(css, page);
    const cap = limit ? ` of ${limit.max} ${limit.unit}${limit.exact ? '' : ' known to save'}` : '';
    const verdict = !limit ? 'no cap' : fits ? 'fits' : fits === false ? 'too big: itch refuses the save' : 'unknown: past the largest size known to save';
    console.log(`${page}: ${chars} characters, ${bytes} bytes${cap} → ${verdict}`);
    process.exitCode = fits === false ? 1 : 0;
  } else {
    const problems = validate(css, page, { served: flag === '--served' });
    for (const p of problems) console.log(`${p.level} ${p.rule}: ${p.message}`);
    console.log(problems.length ? `${problems.length} problem(s); rules in knowledge/itch-custom-css.md §0` : 'no problems found');
    process.exitCode = problems.some((p) => p.level === 'error') ? 1 : 0;
  }
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
