import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkImports, render, validate } from '../src/index.js';
import { config, games, now } from './mirokshi.js';

// R19.ring is about the whole sheet (no B2), so the rule tests leave it to its own test
const rules = (css, page = 'project', options) =>
  checked(css, page, options).map((p) => p.rule);
const checked = (css, page, options) => validate(css, page, options).filter((p) => p.code !== 'R19.ring');

// R17 and R19 lean on the pasted CSS's guard and ring: output.test.js checks them on both together
test("owner profile: the engine's served CSS breaks no rule but R17 and R19", () => {
  const problems = validate(render(config, { seed: 1, data: { games }, now }), 'profile', { served: true });
  assert.deepEqual(problems.filter((p) => p.rule !== 'R17' && p.rule !== 'R19'), []);
});

test('R17: a reduced-motion guard for whatever moves (B1, or one of its own)', () => {
  const B1 = '@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}';
  const moving = [
    '@keyframes custom-x{to{color:red}}#wrapper .a{animation:custom-x 1s}',
    '#wrapper .a{transition:transform .2s}',
    '#wrapper .a{transition:.2s}', // all
    '#wrapper::after{animation:custom-x 1s}',
    '#wrapper .a:before{transition:translate .2s}',
  ];
  for (const css of moving) {
    assert.deepEqual(rules(css), ['R17'], css);
    assert.deepEqual(rules(css + B1), [], css);
  }
  // a nested rule under a selector list moves each of them: here #wrapper::after too, which #wrapper *::after misses
  assert.deepEqual(rules('#wrapper .a,#wrapper{&::after{animation:custom-x 1s}}@media (prefers-reduced-motion:reduce){#wrapper *::after{animation:none!important}}'), ['R17']);
  // #wrapper * misses #wrapper's own pseudo-elements; a guard without !important loses to the element's rule
  assert.deepEqual(rules('#wrapper::after{animation:custom-x 1s}@media (prefers-reduced-motion:reduce){#wrapper *,#wrapper *::after{animation:none!important}}'), ['R17']);
  assert.deepEqual(rules('#wrapper .a{animation:custom-x 1s}@media (prefers-reduced-motion:reduce){#wrapper *{animation:none}}'), ['R17']);
  for (const css of [
    '#wrapper .a{transition:color .2s,background-color .2s}', // colours don't move
    '#wrapper .a{animation:custom-x 1s}@media (prefers-reduced-motion:reduce){#wrapper .a{animation:none}}', // its own guard
    '#wrapper .a:focus-visible{animation:custom-x 1s}@media (prefers-reduced-motion:reduce){#wrapper .a{animation:none!important}}',
    '#wrapper .a{transition:transform .2s}@media (prefers-reduced-motion:reduce){#wrapper *{transition-duration:.01ms!important}}',
    '#wrapper::after{animation:custom-x 1s}@media (prefers-reduced-motion:reduce){#wrapper::after{display:none}}',
    '@media (prefers-reduced-motion:no-preference){#wrapper .a{animation:custom-x 1s}}', // never runs for them
    '#wrapper{& .a{animation:custom-x 1s}}@media (prefers-reduced-motion:reduce){#wrapper .a{animation:none}}', // nested
  ]) assert.deepEqual(rules(css), [], css);
});

test('R17: motion that starts by itself ends within 5 s; nothing stays hidden without it', () => {
  const B1 = '@media (prefers-reduced-motion:reduce){#wrapper *,#wrapper *::after{animation:none!important}}';
  for (const css of [
    '#wrapper .a{animation:custom-x 2s infinite}',
    '#wrapper .a{animation:custom-x 2s 4s}', // delay + duration
    '#wrapper .a{animation:custom-x 2s 3}', // 3 rounds
    '#wrapper .a{animation:custom-x 1s cubic-bezier(.2, .7, .2, 1);animation-iteration-count:infinite}',
    '#wrapper .a{animation-name:custom-x;animation-duration:6s}',
    '#wrapper .a{animation:custom-x 2s;animation-iteration-count:3}', // longhands over the shorthand
    '#wrapper .a{animation:custom-x 1s;animation-delay:4.5s}',
    '#wrapper .a{animation-name:custom-x,custom-y;animation-duration:1s,6s}', // the second one
  ]) assert.deepEqual(rules(css + B1), ['R17'], css);
  for (const css of [
    '#wrapper .a{animation:custom-x 2s 1s,custom-y 1s 2}',
    '#wrapper .a{animation:custom-x 2s 3;animation-iteration-count:1}',
    '#wrapper .a{animation-iteration-count:infinite;animation:custom-x 1s}', // the shorthand resets it
    '#wrapper .a{animation-duration:10s}', // no animation-name: nothing runs
    '#wrapper .a{animation:custom-x infinite}', // 0 s long: nothing moves
    '@media (hover:hover){#wrapper .a:hover,#wrapper .a:focus-visible{animation:custom-x 1s infinite}}', // a visitor starts it
    '#wrapper .a{animation:custom-x linear both;animation-timeline:view()}', // scroll-driven
  ]) assert.deepEqual(rules(css + B1), [], css);
  // base opacity:0 that only the animation lifts
  assert.deepEqual(rules('@keyframes custom-in{to{opacity:1}}#wrapper .a{opacity:0;animation:custom-in 1s forwards}' + B1), ['R17']);
  for (const css of [
    '@keyframes custom-in{from{opacity:0}}#wrapper .a{animation:custom-in 1s backwards}',
    '@keyframes custom-spin{to{rotate:1turn}}#wrapper .a{opacity:0;animation:custom-spin 1s}', // it never shows it
    '@keyframes custom-in{to{opacity:1}}#wrapper .a::after{content:"";opacity:0;animation:custom-in 1s forwards}', // decoration
  ]) assert.deepEqual(rules(css + B1), [], css);
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

test("R5: never hide or relabel itch's UI; restyling it is fine", () => {
  for (const css of [
    '#wrapper .footer{display:none}',
    '#wrapper .footer a{opacity:0}', // the selector only has to contain the UI
    '#wrapper .left_col:has(.buy_row){visibility:hidden}',
    '#wrapper .price_value{font-size:0}',
    '#wrapper .more_information_toggle{transform:scale(0,1)}',
    '#wrapper .embed_preload{clip-path:inset(50%)}',
    '#wrapper .buy_btn::after{content:"Free!"}', // relabel
    '#wrapper .footer{& a{color:transparent}}', // nested
  ]) assert.deepEqual(rules(css), ['R5'], css);
  assert.deepEqual(rules('#user_tools{display:none}'), ['R2', 'R5']);
  assert.deepEqual(rules('#wrapper .footer{display:none;opacity:0}#wrapper .x,#wrapper .buy_row{display:none}'), ['R5', 'R5']);
  for (const css of [
    '#wrapper .footer{color:#999;opacity:.8}#wrapper .footer a{color:inherit}',
    '#wrapper .price_value{color:transparent;background-clip:text;background-image:linear-gradient(red,blue)}',
    '#wrapper .buy_btn::before{content:"";display:none}', // its own pseudo-element
    '#wrapper .game_cell:not(.footer){display:none}#wrapper .footer_x{display:none}',
    '#wrapper .footer{transition:opacity .3s;@starting-style{opacity:0}}@starting-style{#wrapper .footer{opacity:0}}',
  ]) assert.deepEqual(rules(css), [], css);
});

test('R5: leave the External-link badge (::after on outbound links) alone on project pages', () => {
  assert.deepEqual(rules('#wrapper .formatted_description a::after{content:"*"}'), ['R5']);
  assert.deepEqual(rules('#wrapper a[rel~=nofollow]:focus-visible::after{color:red}'), ['R5']);
  assert.deepEqual(rules('#wrapper .user_formatted a:not([rel~=nofollow])::after{content:"*"}'), []);
  assert.deepEqual(rules('#wrapper *::after{animation:none}#wrapper .game_cell::after{content:""}'), []);
  assert.deepEqual(rules('#wrapper .user_profile a::after{content:"*"}', 'profile'), []); // no badge there
});

test('R6: no url() that loads only on interaction, no [value] selectors', () => {
  assert.deepEqual(rules('#wrapper .x:hover{background-image:url(https://x.test/h.png)}'), ['R6', 'R18', 'R18']);
  assert.deepEqual(rules('@media (hover:hover){#wrapper .x:hover,#wrapper .x:focus-visible{background:url(https://x.test/h.png)}}'), ['R6']);
  assert.deepEqual(rules('#wrapper input:checked{& + label{background-image:url("https://x.test/c")}}'), ['R6']);
  assert.deepEqual(rules('#wrapper input[value$="a"]{color:red}'), ['R6']);
  // the same URL loads up front, so it's cached; data: makes no request; a static selector loads it anyway
  for (const css of [
    '#wrapper .x{background-image:url(https://x.test/h.png)}#wrapper .x:focus-visible{background-image:url(https://x.test/h.png)}',
    '#wrapper .x:focus-visible{background-image:url(data:image/png;base64,AA)}',
    '#wrapper .x,#wrapper .x:focus-visible{background-image:url(https://x.test/h.png)}',
    '#wrapper .x:not(:focus-visible){background-image:url(https://x.test/h.png)}',
    '#wrapper [title="[value"]{color:red}',
  ]) assert.deepEqual(rules(css), [], css);
});

test('R19: a general focus ring (B2), and no outline taken away on focus', () => {
  const r19 = (css) => validate(css, 'project').filter((p) => p.rule === 'R19').map((p) => p.code);
  assert.deepEqual(r19('#wrapper a{color:red}'), ['R19.ring']);
  assert.deepEqual(r19('#wrapper .custom-btn:focus-visible{outline:2px solid}'), ['R19.ring']); // one class only
  assert.deepEqual(r19('#wrapper :focus{outline-color:#ffc857}'), ['R19.ring']); // itch's thin ring, just recoloured
  for (const css of [
    '', '@import url("https://x.test/a.css");', '#wrapper{}', // nothing styled yet
    '#wrapper{--focus-ring:#ffc857}#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}', // B2
    '#wrapper a:focus-visible,#wrapper button:focus-visible{outline-style:solid}',
    '#wrapper{& *:focus{outline:3px solid}}',
  ]) assert.deepEqual(r19(css), [], css);
  const ring = '#wrapper :focus-visible{outline:2px solid}';
  assert.deepEqual(r19(ring + '#wrapper .x:focus{outline:none}'), ['R19.none']);
  assert.deepEqual(r19(ring + '#wrapper a:focus:not(:focus-visible){outline:0}'), ['R19.none']);
  for (const css of [
    '#wrapper .x:focus{outline:none;box-shadow:0 0 0 3px #ffc857}', // a ring of its own
    '#wrapper .x:focus{outline:0;border-bottom:2px solid}',
    '#wrapper .x:focus{outline:none!important}', // R14's
    '#wrapper .x{outline:none}', // no focus state named
  ]) assert.deepEqual(r19(ring + css), [], css);
});

test("R20: on jams, never style every h1 or hide itch's title", () => {
  for (const css of [
    '#wrapper h1{color:red}',
    '#wrapper .jam_body h1:focus-visible{color:red}',
    '#wrapper{& h1{font-size:2em}}',
    '#wrapper .jam_title_header{display:none}',
    '#wrapper .jam_header_widget h1.jam_title_header{font-size:0}',
  ]) assert.deepEqual(rules(css, 'jam'), ['R20'], css);
  for (const css of [
    '#wrapper .jam_title_header{color:#ffc857;font-size:3em}',
    '#wrapper .jam_content h1{font-size:1.4em}',
    '#wrapper .jam_header_widget h1{letter-spacing:.05em}',
    '#wrapper h1.custom-title{color:red}',
    '#wrapper .jam_title_header::after{content:"";display:none}',
  ]) assert.deepEqual(rules(css, 'jam'), [], css);
  assert.deepEqual(rules('#wrapper h1{color:red}', 'profile'), []); // jams only
});

test('R21: decorative generated text gets the empty alt', () => {
  for (const css of [
    '#wrapper .a::before{content:"★"}',
    '#wrapper .a:after{content:\'→ \'}',
    '#wrapper .a::before{content:"\\2022"}', // an escaped bullet
    '#wrapper{& .a::after{content:"✦✦"}}',
  ]) assert.deepEqual(rules(css), ['R21'], css);
  for (const css of [
    '#wrapper .a::before{content:"★";content:"★" / ""}', // the fallback pair
    '#wrapper .a::before{content:"▲ 12" / "12 views"}',
    '#wrapper .a::before{content:"New!"}', // words are content
    '#wrapper .a::before{content:"";content:" "}',
    '#wrapper .a::before{content:"(";}#wrapper .a::after{content:" | "}', // ASCII punctuation
    '#wrapper li::before{content:counter(n) " • "}', // the counter is content
    '#wrapper .a{content:"★"}', // on the element itself, not generated
  ]) assert.deepEqual(rules(css), [], css);
});

test("R22: no containing block or isolation on an HTML5 game's ancestors (project pages)", () => {
  const rules = (css, page) => validate(css, page ?? 'project').filter((p) => p.rule !== 'R17' && p.code !== 'R19.ring').map((p) => p.rule);
  for (const css of [
    '#wrapper #inner_column{backdrop-filter:blur(8px)}',
    '#wrapper .view_game_page{transform:translateY(0)}',
    '#wrapper{filter:saturate(1.2)}',
    '#wrapper .embed_wrapper{will-change:transform}',
    '#wrapper .inner_column{contain:paint}',
    '#wrapper .columns:has(.game_frame){scale:1}', // holds the game, so it's an ancestor
    '#wrapper #inner_column{&:focus-within{filter:blur(1px)}}', // nested: & is #inner_column
    '#wrapper{& .view_game_page{transform:scale(1)}}',
    '#wrapper{position:relative;isolation:isolate}',
    '@keyframes custom-in{from{transform:translateY(20px)}}#wrapper #inner_column{animation:custom-in .5s both}',
    '@keyframes custom-in{from{filter:blur(4px)}}#wrapper #inner_column{animation-name:custom-in;animation-fill-mode:forwards}',
  ]) assert.deepEqual(rules(css), ['R22'], css);
  for (const css of [
    '#wrapper #inner_column::before{backdrop-filter:blur(8px)}', // a pseudo-element holds nothing
    '#wrapper .game_cell{transform:rotate(2deg)}#wrapper #header{filter:none}',
    '#wrapper:not(:has(.html_embed_widget)) #inner_column{backdrop-filter:blur(8px)}', // guarded
    '#wrapper:not(:has(.html_embed_widget)){& #inner_column{filter:blur(1px)}}', // guarded by its parent
    '#wrapper #inner_column{&::before{backdrop-filter:blur(8px)}}', // nested pseudo-element
    '#wrapper{isolation:isolate}body.frame_maximized #wrapper{isolation:auto}', // B4's release
    '#wrapper #inner_column{isolation:isolate}#wrapper:has(.game_frame.maximized) #inner_column{isolation:auto}',
    '#wrapper #inner_column{filter:blur(1px)}body.frame_maximized #wrapper #inner_column{filter:none}',
    '@keyframes custom-in{from{transform:translateY(20px)}}#wrapper #inner_column{animation:custom-in .5s}', // no fill mode
    '@keyframes custom-in{from{opacity:0}}#wrapper #inner_column{animation:custom-in .5s both}', // opacity makes no box
    '@starting-style{#wrapper #inner_column{transform:scale(.9)}}',
  ]) assert.deepEqual(rules(css), [], css);
  assert.deepEqual(rules('#wrapper{filter:saturate(1.2)}', 'profile'), []);
});

test('R10 over the network: each @import answers 2xx text/css (checkImports, with a fake loader)', async () => {
  const answers = {
    'https://a.test/ok.css': { status: 200, type: 'text/css; charset=utf-8' },
    'https://a.test/gone.css': { status: 404, type: 'text/html' },
    'https://fonts.googleapis.com/css2?family=Synee&display=swap': { status: 400, type: 'text/html' },
    'https://a.test/plain.css': { status: 200, type: 'text/plain' },
    'https://a.test/slow.css': { error: 'timeout' },
    'https://a.test/down.css': { error: 'failed', reason: 'ENOTFOUND' },
  };
  const asked = [];
  const load = async (url) => {
    asked.push(url);
    return answers[url] ?? { error: 'blocked' };
  };
  const at = (problems) => problems.map((p) => `${p.code} ${p.level} ${p.line}:${p.column}`);
  const urls = Object.keys(answers);
  const imports = (list) => list.map((u) => `@import url("${u}");`).join('\n');
  assert.deepEqual(at(await checkImports(imports(urls.slice(0, 4)), load)), [
    'R10.status error 2:1',
    'R10.fonts error 3:1',
    'R10.type error 4:1',
  ]);
  assert.deepEqual(at(await checkImports(imports(urls.slice(4)), load)), ['R10.slow warning 1:1', 'R10.failed error 2:1']);
  // each https URL once, at most 4; http:// (R10.absolute), raw GitHub (R10.raw), nested and blocked ones give nothing
  asked.length = 0;
  const css = '@import "https://a.test/x.css";@import url(https://a.test/x.css);@import "http://a.test/h.css";' +
    '@import "https://raw.githubusercontent.com/u/r/main/a.css";@media print{@import "https://a.test/n.css";}' +
    imports(['https://a.test/1.css', 'https://a.test/2.css', 'https://a.test/3.css', 'https://a.test/4.css']);
  assert.deepEqual(await checkImports(css, load), []);
  assert.deepEqual(asked, ['https://a.test/x.css', 'https://a.test/1.css', 'https://a.test/2.css', 'https://a.test/3.css']);
  // the message is the engine's text for the code
  const [p] = await checkImports(imports(['https://a.test/gone.css']), load);
  assert.equal(p.message, '@import url("https://a.test/gone.css"): answered HTTP 404, so browsers drop it');
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
  const levels = (css) => checked(css, 'project').map((p) => `${p.rule} ${p.level}`);
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
  assert.deepEqual(checked('#wrapper{--itchio_link_color:red}', 'profile').map((p) => `${p.rule} ${p.level}`), ['R3 warning']);
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
  const levels = (css) => checked(css, 'project').map((p) => `${p.rule} ${p.level}`);
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
  assert.deepEqual(checked(big, 'profile').map((p) => [p.rule, p.level]), [['R7', 'error']]);
  assert.deepEqual(rules(big, 'profile', { served: true }), []);
  assert.deepEqual(checked(`#wrapper{--x:"${'a'.repeat(20410)}"}`, 'jam').map((p) => [p.rule, p.level]), [['R7', 'warning']]);
});
