import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { render } from '../src/index.js';
import { config } from './mirokshi.js';

// UPDATE_SNAPSHOTS=1 npm test rewrites the snapshot after an intended change.
const SNAP = new URL('./title.snap.css', import.meta.url);

test('title: snapshot for a fixed seed', () => {
  const css = render(config, { seed: 'snapshot' });
  if (process.env.UPDATE_SNAPSHOTS) writeFileSync(SNAP, css);
  assert.equal(css, readFileSync(SNAP, 'utf8'));
});

test('same seed, same CSS; another seed, other CSS', () => {
  assert.equal(render(config, { seed: 7 }), render(config, { seed: 7 }));
  assert.notEqual(render(config, { seed: 7 }), render(config, { seed: 8 }));
});

test('title: never the same font on two letters in a row', () => {
  const { fonts } = config.plugins[0].options;
  for (let seed = 0; seed < 200; seed++) {
    const letters = render(config, { seed }).split('\n').filter((l) => l.includes('span:nth-child'));
    assert.equal(letters.length, 8);
    const keys = letters.map((l) => Object.keys(fonts).find((k) => l.includes(fonts[k])));
    keys.forEach((k, i) => assert.notEqual(k, keys[i - 1], `seed ${seed}`));
  }
});

test('title: rejects bags that cannot be mixed, and unknown fonts', () => {
  const bad = (options) => render({ plugins: [{ use: 'title', options }] }, { seed: 1 });
  assert.throws(() => bad({ fonts: { a: 'x', b: 'y' }, bag: ['a', 'a', 'a', 'b'] }), /more than half/);
  assert.throws(() => bad({ fonts: { a: 'x' }, bag: ['a', 'z'] }), /not in fonts/);
});

test('unknown plugin throws', () => {
  assert.throws(() => render({ plugins: [{ use: 'nope' }] }), /unknown plugin "nope"/);
  assert.throws(() => render({ plugins: [{ use: 'toString' }] }), /unknown plugin/);
});
