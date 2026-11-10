// The two languages must stay in step: same ids, same {{placeholders}}, the validator's messages
// matching the engine's (engine/src/messages.json is the English), the rule titles matching §0 of
// the knowledge base, and every id the code asks for present.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const es = JSON.parse(read('../locales/es.json'));
const en = { ...JSON.parse(read('../locales/en.json')), validator: JSON.parse(read('../../engine/src/messages.json')) };

// { a: { b: 'x' }, c: ['y'] } → { 'a.b': 'x', 'c.0': 'y' }
const flat = (o, prefix = '') =>
  Object.entries(o).reduce((acc, [k, v]) => (typeof v === 'object' ? { ...acc, ...flat(v, `${prefix}${k}.`) } : { ...acc, [`${prefix}${k}`]: v }), {});
const holes = (s) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

test('es and en have the same ids, with the same placeholders', () => {
  const [a, b] = [flat(es), flat(en)];
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  for (const k of Object.keys(a)) assert.deepEqual(holes(a[k]), holes(b[k]), k);
});

test("the rule titles in English are §0's", () => {
  const md = read('../../knowledge/itch-custom-css.md');
  const start = md.indexOf('## 0.');
  const section = md.slice(start, md.indexOf('\n## ', start + 5));
  const titles = Object.fromEntries([...section.matchAll(/^(\d+)\. \*\*(.+?)\*\*/gm)].map((m) => [`R${m[1]}`, m[2].replaceAll('`', '')]));
  assert.deepEqual(en.rules, titles);
});

test('every id the code asks for exists', () => {
  const dir = new URL('../src/', import.meta.url);
  const files = readdirSync(dir, { recursive: true }).filter((f) => /\.jsx?$/.test(f));
  const ids = new Set();
  for (const f of files) for (const m of readFileSync(new URL(f.replaceAll('\\', '/'), dir), 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)) ids.add(m[1]);
  assert.ok(ids.size > 50);
  const known = flat(es);
  // plural ids (lint.errors) live as lint.errors_one / _other
  for (const id of ids) assert.ok(id in known || `${id}_one` in known || Object.keys(known).some((k) => k.startsWith(`${id}.`)), id);
});
