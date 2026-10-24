import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importLine, measure, paste, render } from '../src/index.js';
import { config, games, now } from './mirokshi.js';

test('paste: the served rules on one line', () => {
  const options = { seed: 4, data: { games }, now };
  const pasted = paste(config, options);
  assert.ok(!pasted.includes('\n'));
  assert.equal(pasted, render(config, options).trimEnd().split('\n').join(''));
});

test('importLine: https only, nothing that breaks out of the string', () => {
  assert.equal(importLine('https://example.test/c/abc.css'), '@import url("https://example.test/c/abc.css");');
  assert.throws(() => importLine('http://example.test/a.css'), /https/);
  assert.throws(() => importLine('/relative.css'), TypeError);
  const line = importLine('https://example.test/a"b?c\\d\ne');
  assert.equal(line.slice(13, -3).search(/["\\\n]/), -1);
});

test('measure: profile cap in bytes, project in CRLF, jam past the known size', () => {
  assert.equal(measure('a'.repeat(5120), 'profile').fits, true);
  assert.equal(measure('a'.repeat(5121), 'profile').fits, false);
  assert.deepEqual(measure('é'.repeat(2561), 'profile'), {
    page: 'profile', chars: 2561, bytes: 5122, limit: { max: 5120, unit: 'bytes', exact: true }, fits: false,
  });
  assert.equal(measure(`\n  ${'a'.repeat(5120)}  \n`, 'profile').fits, true); // edge whitespace is free
  assert.equal(measure('a{}\nb{}', 'profile').chars, 7);
  assert.equal(measure('a{}\r\nb{}', 'project').chars, 8);
  assert.equal(measure('a{}\nb{}', 'project').chars, 8);
  assert.equal(measure('a'.repeat(1e6), 'project').fits, true);
  assert.equal(measure('a'.repeat(20410), 'jam').fits, true);
  assert.equal(measure('a'.repeat(20411), 'jam').fits, null);
  assert.throws(() => measure('', 'devlog'), /profile, project or jam/);
});
