import assert from 'node:assert/strict';
import { test } from 'node:test';
import { minify } from '../src/css.js';
import { importLine, measure, paste, render, validate } from '../src/index.js';
import { config, games, now, pasted } from './mirokshi.js';

test('paste: the served rules on one line', () => {
  const options = { seed: 4, data: { games }, now };
  const css = paste(config, options);
  assert.ok(!css.includes('\n'));
  assert.equal(css, render(config, options).trimEnd().split('\n').join(''));
});

test('minify: drops comments and spare whitespace, never touches strings, url() or escapes', () => {
  assert.equal(minify('/* a */\r\n#wrapper  .x ,\n#wrapper ::selection { color: red ;\n}\n'), '#wrapper .x,#wrapper ::selection{color:red}');
  assert.equal(minify('a : b'), 'a :b'); // the space before : stays, as in the old hook (" ::selection")
  const kept = '#wrapper::before{content:"a  ;  b /* c */";background:url(data:x/y;a,{b})}';
  assert.equal(minify(kept), kept);
  assert.equal(minify("#wrapper .custom-w-1\\/2{width:50% !important}"), "#wrapper .custom-w-1\\/2{width:50% !important}");
  assert.equal(minify('@media (max-width: 650px) {#wrapper{margin:0 auto}}'), '@media (max-width:650px){#wrapper{margin:0 auto}}');
  assert.equal(minify('  /* only */  '), '');
});

test('css plugin: the stylesheet minified, where it sits in the config', () => {
  const css = paste({ plugins: [{ use: 'css', options: { css: '@import url("https://x.test/a.css");\n#wrapper { color: red; }' } }] });
  assert.equal(css, '@import url("https://x.test/a.css");#wrapper{color:red}');
  assert.throws(() => paste({ plugins: [{ use: 'css', options: {} }] }), /needs css/);
});

test('phase 1 exit: the owner profile comes whole from the engine', () => {
  const pastedCss = paste(pasted);
  assert.equal(measure(pastedCss, 'profile').fits, true);
  // the title's gold hover is decorative and the title can't take focus, so it has no focus twin; its
  // wave runs forever, past R17's 5 s; and there's no general focus ring, R19's B2 (known, 2026-11-23)
  assert.deepEqual(validate(pastedCss, 'profile').map((p) => p.code), ['R17.long', 'R19.ring', 'R18.twin']);
  // the served effects lean on the pasted CSS's reduced-motion guard, so R17 is checked on both together:
  // the title, greeting, foil and ascii run forever (known, 2026-11-23)
  const served = render(config, { seed: 1, data: { games }, now });
  assert.deepEqual(validate(served, 'profile', { served: true }).filter((p) => p.rule !== 'R17' && p.rule !== 'R19'), []);
  const r17 = validate(pastedCss + served, 'profile', { served: true }).filter((p) => p.rule === 'R17');
  assert.deepEqual(r17.map((p) => `${p.code} ${p.params.sel}`), [
    'R17.long #wrapper .custom-title span',
    'R17.long #wrapper h1.custom-title',
    'R17.long #wrapper .custom-hello::before',
    'R17.long #wrapper .game_cell::before',
    'R17.long #wrapper::after',
  ]);
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
