import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exportFor } from '../src/export.js';

const base = { page: 'profile', title: null, greeting: null, cards: false, ascii: false };
// minified CSS of exactly n UTF-8 bytes; fill is a 1- or 2-byte character
const sized = (n, fill = 'a') => {
  const shell = '#wrapper{--x:""}';
  const width = new TextEncoder().encode(fill).length;
  assert.equal((n - shell.length) % width, 0);
  return `#wrapper{--x:"${fill.repeat((n - shell.length) / width)}"}`;
};

test('profile: 5,120 bytes are pasted, 5,121 go to the link', () => {
  const at = exportFor({ ...base, css: sized(5120) });
  assert.equal(at.mode, 'paste');
  assert.equal(at.bytes, 5120);
  assert.equal(at.max, 5120);
  assert.deepEqual(exportFor({ ...base, css: sized(5121) }), { mode: 'import', reason: 'size', bytes: 5121, max: 5120 });
});

test('profile: the cap counts UTF-8 bytes, not characters', () => {
  assert.equal(exportFor({ ...base, css: sized(5120, 'ñ') }).mode, 'paste');
  assert.equal(exportFor({ ...base, css: sized(5122, 'ñ') }).mode, 'import');
  // 5,120 characters, two of them 2-byte: 5,122 bytes, over the cap
  const css = `#wrapper{--x:"ññ${'a'.repeat(5102)}"}`;
  assert.equal([...css].length, 5120);
  assert.deepEqual(exportFor({ ...base, css }), { mode: 'import', reason: 'size', bytes: 5122, max: 5120 });
});

test('the size is measured after minifying: comments and spare whitespace are free', () => {
  const css = `/* ${'note '.repeat(2000)} */\n#wrapper  {\n  color : red ;\n}\n`;
  assert.deepEqual(exportFor({ ...base, css }), { mode: 'paste', css: '#wrapper{color :red}', bytes: 20, max: 5120 });
});

test('game page and devlog: always pasted, whatever the size', () => {
  for (const page of ['project', 'devlog']) {
    const out = exportFor({ ...base, page, css: sized(60001) });
    assert.equal(out.mode, 'paste');
    assert.equal(out.max, null);
  }
});

test('any per-visit effect: only the link', () => {
  for (const effect of [{ title: { text: 'A', fonts: ['syne', 'mono'] } }, { greeting: { first: 'Hi', others: ['Hola'] } }, { cards: true }, { ascii: true }]) {
    assert.deepEqual(exportFor({ ...base, ...effect, css: '#wrapper{}' }), { mode: 'import', reason: 'effects' });
  }
});
