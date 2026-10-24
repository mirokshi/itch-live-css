import assert from 'node:assert/strict';
import { test } from 'node:test';
import { render, validate } from '../src/index.js';
import { config, games, now } from './mirokshi.js';

const rules = (css, page = 'project', options) => validate(css, page, options).map((p) => p.rule);

test("owner profile: the engine's served CSS breaks no rule", () => {
  assert.deepEqual(validate(render(config, { seed: 1, data: { games }, now }), 'profile', { served: true }), []);
});

test('R2: every style rule starts with #wrapper, also in @media, @supports and @layer', () => {
  assert.deepEqual(rules('a{color:red}'), ['R2']);
  assert.deepEqual(rules('#wrapper a,b{}'), ['R2']);
  assert.deepEqual(rules('#wrapperX{}'), ['R2']);
  assert.deepEqual(rules('@media (min-width:600px){@supports (x:y){html{}}}'), ['R2']);
  assert.deepEqual(rules('#wrapper :is(a, b){} body.frame_maximized #wrapper{isolation:auto}'), []);
  assert.deepEqual(rules('#wrapper{& a{}.x{}}'), []); // nested rules are relative
  assert.deepEqual(rules('@keyframes custom-x{from{}to{}}@font-face{font-family:x}@property --a{syntax:"*"}'), []);
  // braces and semicolons in strings, comments and unquoted url() don't count
  assert.deepEqual(rules('#wrapper::before{content:"};a{"}/* b{} */#wrapper{background:url(data:x;{)}'), []);
});

test('R8: no <style> tags, even in comments and strings', () => {
  assert.deepEqual(rules('#wrapper{}</STYLE >'), ['R8']);
  assert.deepEqual(rules('/* </style> */#wrapper{}'), ['R8']);
  assert.deepEqual(rules('<style>#wrapper{}'), ['R8', 'R2']); // the tag also spoils the first selector
});

test('R9 and R15: @import first, never on jams, never into a layer', () => {
  assert.deepEqual(rules('@charset "utf-8";/* x */@layer a,b;@import url("https://x.test/a.css");#wrapper{}'), []);
  assert.deepEqual(rules('#wrapper{}@import url("https://x.test/a.css");'), ['R9']);
  assert.deepEqual(rules('@font-face{font-family:x}@import "https://x.test/a.css";'), ['R9']);
  assert.deepEqual(rules('@import "https://x.test/a.css";@layer x;@import "https://x.test/b.css";'), ['R9']);
  assert.deepEqual(rules('@media print{@import "https://x.test/a.css";}'), ['R9']);
  assert.deepEqual(rules('@import "https://x.test/a.css";', 'jam'), ['R9']);
  assert.deepEqual(rules('@import url("https://x.test/a.css") layer(base);'), ['R15']);
  assert.deepEqual(rules('@import url("https://x.test/layer.css");'), []);
  assert.deepEqual(rules('@layer base{#wrapper a{}}'), ['R15']);
});

test('R16: @keyframes names start with custom-', () => {
  assert.deepEqual(rules('@keyframes spin{to{rotate:1turn}}'), ['R16']);
  assert.deepEqual(rules('@media (x){@-webkit-keyframes pulse{}}'), ['R16']);
  assert.deepEqual(rules('@keyframes "custom-x"{}@keyframes custom-y{}'), []);
});

test('R10: imports over https, not from raw GitHub, pinned on jsDelivr', () => {
  const levels = (css) => validate(css, 'project').map((p) => `${p.rule} ${p.level}`);
  assert.deepEqual(levels('@import "http://x.test/a.css";'), ['R10 error']);
  assert.deepEqual(levels('@import url(a.css);'), ['R10 error']);
  assert.deepEqual(levels('@import url("https://raw.githubusercontent.com/u/r/main/a.css");'), ['R10 error']);
  assert.deepEqual(levels('@import url("https://cdn.jsdelivr.net/gh/u/r/a.css");'), ['R10 warning']);
  assert.deepEqual(levels('@import url("https://cdn.jsdelivr.net/gh/u/r@main/a.css");'), ['R10 warning']);
  assert.deepEqual(levels('@import url("https://cdn.jsdelivr.net/gh/u/r@abc1234/a.css");'), ['R10 warning']);
  assert.deepEqual(levels('@import url("https://cdn.jsdelivr.net/gh/u/r@1.2.3/a.css");'), []);
  assert.deepEqual(levels('@import url("https://cdn.jsdelivr.net/npm/@fontsource-variable/syne@5.2.6/index.css");'), []);
  assert.deepEqual(levels('@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");'), []);
  assert.deepEqual(levels('@import url("data:text/css,%23wrapper{color:red}");'), []);
});

test('R23: every url() absolute https:// or data:', () => {
  assert.deepEqual(rules('#wrapper{background:url(img.png)}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background:url("http://x.test/a.png")}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background:url(//x.test/a.png)}#wrapper a{background:url(//x.test/a.png)}'), ['R23']);
  assert.deepEqual(rules('@font-face{font-family:x;src:url(\'x.woff2\')}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background:url("https://x.test/a.png"),url(data:image/png;base64,AAAA)}/* url(a.png) */'), []);
});

test('R11: no class names that ad blockers hide', () => {
  assert.deepEqual(rules('#wrapper .custom-ad{}'), ['R11']);
  assert.deepEqual(rules('#wrapper .custom-share-button:hover,#wrapper{& .custom-share-button{}}'), ['R11']);
  assert.deepEqual(rules('#wrapper .custom-card,#wrapper [class*=custom-]{}'), []);
});

test('R7: the cap applies to pasted CSS only', () => {
  const big = `#wrapper{--x:"${'a'.repeat(5120)}"}`;
  assert.deepEqual(validate(big, 'profile').map((p) => [p.rule, p.level]), [['R7', 'error']]);
  assert.deepEqual(rules(big, 'profile', { served: true }), []);
  assert.deepEqual(validate(`#wrapper{--x:"${'a'.repeat(20410)}"}`, 'jam').map((p) => [p.rule, p.level]), [['R7', 'warning']]);
});
