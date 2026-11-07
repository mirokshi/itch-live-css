// Cross-check with the knowledge base: the validator's rule ids and rules.js's data must match §0 of
// knowledge/itch-custom-css.md. When the main file changes, this fails until the engine follows.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { LIMITS, SOURCES } from '../src/rules.js';

const md = readFileSync(new URL('../../knowledge/itch-custom-css.md', import.meta.url), 'utf8').replace(/\r/g, '');
const start = md.indexOf('## 0.');
const section = md.slice(start, md.indexOf('\n### 0.1', start));
// R1 … R24 → the rule's text (one line each in §0)
const RULES = Object.fromEntries([...section.matchAll(/^(\d+)\. (.+)$/gm)].map((m) => [`R${m[1]}`, m[2]]));

test('§0 still has the 24 rules', () => {
  assert.equal(Object.keys(RULES).length, 24);
});

test('every rule id the validator emits exists in §0', () => {
  const source = readFileSync(new URL('../src/validate.js', import.meta.url), 'utf8');
  const ids = new Set([...source.matchAll(/'(R\d+)'/g)].map((m) => m[1]));
  assert.ok(ids.size >= 14);
  for (const id of ids) assert.ok(RULES[id], `${id} is not in §0`);
});

test("each rules.js constant's fact ids appear in its rule's text", () => {
  for (const [name, { rule, facts }] of Object.entries(SOURCES)) {
    assert.ok(RULES[rule], `${name}: ${rule} is not in §0`);
    for (const fact of facts) assert.ok(RULES[rule].includes(fact), `${name}: ${fact} is not in ${rule}`);
  }
});

test("R7's caps match the numbers in its text", () => {
  assert.match(RULES.R7, new RegExp(`${LIMITS.profile.max.toLocaleString('en-US')} UTF-8 bytes`));
  assert.match(RULES.R7, new RegExp(`${LIMITS.jam.max.toLocaleString('en-US')} chars`));
  assert.match(RULES.R7, /Project\/devlog: no CSS cap/);
  assert.equal(LIMITS.project, null);
});
