import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { cssString } from '../src/css.js';
import { render } from '../src/index.js';
import { config, games, now } from './mirokshi.js';

// UPDATE_SNAPSHOTS=1 npm test rewrites the snapshot after an intended change.
const SNAP = new URL('./mirokshi.snap.css', import.meta.url);

test('owner profile: snapshot for a fixed seed', () => {
  const css = render(config, { seed: 'snapshot', data: { games }, now });
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

test('greeting: first at both ends, one roll step per greeting', () => {
  const { first, others } = config.plugins[1].options;
  const css = render({ plugins: [config.plugins[1]] }, { seed: 3 });
  const f = cssString(first).slice(1, -1);
  assert.ok(css.includes(`content:"${f}\\a `) && css.includes(`\\a ${f}" / ""`));
  const steps = css.match(/@keyframes custom-hello-roll\{(.*)\}/)[1].match(/translate:0 -?[\d.]+em/g);
  assert.equal(steps.length, 2 * (others.length + 1)); // hold and roll per step
  assert.match(css, /animation:custom-hello-roll 29\.5s/); // 10 steps × (2.5 + 0.45) s
  assert.throws(() => render({ plugins: [{ use: 'greeting', options: { first } }] }), /needs first/);
});

test('every @keyframes name starts with custom- (R16)', () => {
  const names = [...render(config, { seed: 5 }).matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1]);
  assert.ok(names.length >= 4);
  for (const name of names) assert.match(name, /^custom-/);
});

test('ascii: every text row is 100 characters wide, in every layer', () => {
  const css = render({ plugins: [{ use: 'ascii' }] }, { seed: 9 });
  // rows as they sit in the data URI: < and > encoded, the text itself is only letters and spaces
  const rows = [...css.matchAll(/%3Ctext [^%]*%3E([^%]*)%3C\/text%3E/g)].map((m) => m[1]);
  assert.equal(rows.length, 3 * 32); // field (2 layers) + wave
  for (const row of rows) assert.equal(row.length, 100);
});

test('cards: figures, labels and id check', () => {
  const cards = (g) => render({ plugins: [{ use: 'cards' }] }, { seed: 1, data: { games: g }, now });
  const css = cards(games);
  const rule = (id, part) => css.split('\n').find((l) => l.startsWith(`#wrapper .game_cell[data-game_id="${id}"] .${part}`));
  assert.match(rule(2660825, 'game_cell_data'), /"1\.8k views"/); // no downloads, so none shown
  assert.match(rule(1862929, 'game_cell_data'), /"920 views, 312 downloads"/);
  assert.match(rule(2660825, 'game_thumb'), /"Most viewed"/);
  assert.equal(rule(1862929, 'game_thumb'), undefined); // old and not the top one
  assert.match(rule(2540459, 'game_thumb'), /"New"/);
  assert.doesNotMatch(cards([games[0]]), /Most viewed/); // a single game is not "most" anything
  assert.doesNotMatch(cards([]), /data-game_id/); // no data: foil only
  assert.throws(() => cards([{ ...games[0], id: '1"]{}*{color:red' }]), /integer id/);
});
