import assert from 'node:assert/strict';
import { test } from 'node:test';
import { render, validate } from '../src/index.js';
import { config, games, now } from './mirokshi.js';

const rules = (css, page = 'project', options) => validate(css, page, options).map((p) => p.rule);

test("owner profile: the engine's served CSS has no errors", () => {
  const problems = validate(render(config, { seed: 1, data: { games }, now }), 'profile', { served: true });
  // known: the cards' foil hover, ported 1:1 from the prototype, is neither gated nor focusable (R18)
  assert.deepEqual(problems.map((p) => `${p.rule} ${p.level}`), Array(4).fill('R18 warning'));
  assert.ok(problems.every((p) => p.message.includes('.game_cell:hover')));
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
  assert.deepEqual(rules('#wrapper::before{content:"};a{"}/* b{} */#wrapper{background-image:url(data:x;{)}'), []);
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
  assert.deepEqual(rules('#wrapper{background-image:url(img.png)}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background-image:url("http://x.test/a.png")}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background-image:url(//x.test/a.png)}#wrapper a{background:url(//x.test/a.png)}'), ['R23']);
  assert.deepEqual(rules('@font-face{font-family:x;src:url(\'x.woff2\')}'), ['R23']);
  assert.deepEqual(rules('#wrapper{background-image:url("https://x.test/a.png"),url(data:image/png;base64,AAAA)}/* url(a.png) */'), []);
});

test('R11: no class names that ad blockers hide', () => {
  assert.deepEqual(rules('#wrapper .custom-ad{}'), ['R11']);
  assert.deepEqual(rules('#wrapper .custom-share-button:focus,#wrapper{& .custom-share-button{}}'), ['R11']);
  assert.deepEqual(rules('#wrapper .custom-card,#wrapper [class*=custom-]{}'), []);
});

test('R3: variables on #wrapper or below; a profile sets itch\'s on #wrapper .user_page', () => {
  assert.deepEqual(rules(':root{--gold:#ffc857}'), ['R3']);
  assert.deepEqual(rules('html{--a:1}html{color:red}'), ['R3', 'R2']); // without variables it's plain R2
  assert.deepEqual(validate('#wrapper{--itchio_link_color:red}', 'profile').map((p) => `${p.rule} ${p.level}`), ['R3 warning']);
  assert.deepEqual(rules('#wrapper .user_page{--itchio_link_color:red}#wrapper{--gold:#ffc857}', 'profile'), []);
  assert.deepEqual(rules('#wrapper{--itchio_link_color:red}', 'project'), []);
});

test('R4: no background shorthand on the #wrapper box itself', () => {
  assert.deepEqual(rules('#wrapper{background:#222}'), ['R4']);
  assert.deepEqual(rules('@media (min-width:1px){#wrapper.jam_page_wrap:not(:has(.x .y)){background:none}}'), ['R4']);
  assert.deepEqual(rules('body.frame_maximized #wrapper{background:none}'), ['R4']);
  assert.deepEqual(rules('#wrapper{background-color:#222}#wrapper .x,#wrapper::before,#wrapper>a{background:#222}'), []);
});

test('R18: hover gated in @media (hover:hover), with a focus twin', () => {
  const r18 = (css) => validate(css, 'project').filter((p) => p.rule === 'R18').map((p) => p.message.split('"')[2].trim());
  assert.deepEqual(r18('#wrapper a:hover{color:red}'), [
    ': put hover effects inside @media (hover:hover)',
    'has no focus twin: give it the same effect on :focus-visible',
  ]);
  assert.deepEqual(r18('@media (hover:hover){#wrapper a:hover{color:red}}#wrapper a:focus-visible{color:red}'), []);
  assert.deepEqual(r18('@media (any-hover:hover) and (pointer:fine){#wrapper a:hover,#wrapper a:focus{color:red}}'), []);
  assert.deepEqual(r18('@media (hover:hover){#wrapper .card:is(:hover,:focus-within){color:red}}'), []);
});

test('R12: no numbered ids', () => {
  assert.deepEqual(rules('#wrapper #user_123 a,#wrapper{& #view_game_456{}}'), ['R12', 'R12']);
  assert.deepEqual(rules('#wrapper #inner_column,#wrapper [style*="#ff0000"],#wrapper h1:nth-child(2){}'), []);
});

test('R14: no outline:none!important, no !important on an animated property', () => {
  const levels = (css) => validate(css, 'project').map((p) => `${p.rule} ${p.level}`);
  assert.deepEqual(levels('#wrapper a:focus{outline:none !important}'), ['R14 error']);
  assert.deepEqual(levels('#wrapper a:focus{outline:0!important}#wrapper a{outline:none}'), ['R14 error']);
  assert.deepEqual(levels('@keyframes custom-x{to{opacity:0;animation-timing-function:ease}}#wrapper a{opacity:1!important}'), ['R14 warning']);
  assert.deepEqual(
    levels('@keyframes custom-x{to{opacity:0}}#wrapper a{animation-timing-function:ease!important}' +
      '@media (prefers-reduced-motion:reduce){#wrapper *{opacity:1!important;animation:none!important}}'),
    [],
  );
});

test('R7: the cap applies to pasted CSS only', () => {
  const big = `#wrapper{--x:"${'a'.repeat(5120)}"}`;
  assert.deepEqual(validate(big, 'profile').map((p) => [p.rule, p.level]), [['R7', 'error']]);
  assert.deepEqual(rules(big, 'profile', { served: true }), []);
  assert.deepEqual(validate(`#wrapper{--x:"${'a'.repeat(20410)}"}`, 'jam').map((p) => [p.rule, p.level]), [['R7', 'warning']]);
});
