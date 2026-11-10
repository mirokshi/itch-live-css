import assert from 'node:assert/strict';
import { test } from 'node:test';
import postcss from 'postcss';
import { itchRules } from '../src/validate.js';
import { validate } from '../src/index.js';

test('itchRules: a PostCSS plugin whose warnings carry rule and level, and leave the CSS alone', () => {
  const css = 'a{color:red}\n@keyframes spin{to{rotate:1turn}}';
  const result = postcss([itchRules({ page: 'project' })]).process(css, { from: undefined });
  assert.equal(result.css, css); // reading .css runs the plugins synchronously
  assert.deepEqual(
    result.warnings().map((w) => [w.plugin, w.rule, w.level]),
    [['itch-rules', 'R2', 'error'], ['itch-rules', 'R16', 'error']],
  );
});

test('itchRules: one plugin instance, two runs, no shared state', () => {
  const run = postcss([itchRules({ page: 'project' })]);
  const css = '#wrapper .custom-ad{}#wrapper a:hover{}';
  const first = run.process(css, { from: undefined }).sync().warnings().length;
  assert.equal(first, 3); // R11, R18 ungated, R18 no focus twin
  assert.equal(run.process(css, { from: undefined }).sync().warnings().length, first);
});

test('syntax: the strict parser adds a positioned hint and the rules still run', () => {
  const problems = validate('#wrapper a{color:red}\nbody{color:blue', 'project');
  assert.deepEqual(problems.map((p) => p.rule), ['syntax', 'R2']);
  assert.equal(problems[0].level, 'error');
  assert.match(problems[0].message, /Unclosed block/);
  assert.equal(problems[0].line, 2);
  assert.equal(problems[0].column, 1);
  assert.deepEqual(validate('#wrapper a{color:red}', 'project'), []);
  // itch deletes </style>, so what browsers parse is complete
  assert.deepEqual(validate('#wrapper{}</STYLE >', 'project').map((p) => p.rule), ['R8']);
});

test('positions: each problem points at its node, narrowed to the name it reports', () => {
  const [r2] = validate('#wrapper a{}\n  body{}', 'project');
  assert.deepEqual([r2.rule, r2.line, r2.column, r2.endLine, r2.endColumn], ['R2', 2, 3, 2, 7]);
  const [r16] = validate('#wrapper{}\n@keyframes spin{}', 'project');
  assert.deepEqual([r16.rule, r16.line, r16.column], ['R16', 2, 12]);
  // raw-text rules have no position
  assert.equal('line' in validate('#wrapper{}</style>', 'project')[0], false);
});

test('review fixes: each selector gets its own span; R14 keeps the !important as written', () => {
  const [r2] = validate('#wrapper a{}\n#wrapper b, b{}', 'project');
  assert.deepEqual([r2.line, r2.column, r2.endColumn], [2, 13, 14]);
  assert.match(validate('#wrapper a:focus{outline:none !important}', 'project')[0].message, /^outline:none !important hides/);
  assert.match(validate('#wrapper a:focus{outline:0!important}', 'project')[0].message, /^outline:0!important hides/);
});

test('messages: every problem carries a code and params that rebuild its text, and every message is used', async () => {
  const { text } = await import('../src/validate.js');
  const { readFileSync } = await import('node:fs');
  const messages = JSON.parse(readFileSync(new URL('../src/messages.json', import.meta.url), 'utf8'));
  const problems = validate('#wrapper a{}\nbody{}\n@keyframes spin{}\n#wrapper .custom-ad:hover{outline:none!important}\n#wrapper{', 'profile');
  for (const p of problems) assert.equal(text(p.code, p.params), p.message);
  const source = readFileSync(new URL('../src/validate.js', import.meta.url), 'utf8');
  for (const [rule, group] of Object.entries(messages)) for (const key of Object.keys(group)) assert.ok(source.includes(`'${rule}.${key}'`), `${rule}.${key} is never used`);
  assert.throws(() => text('R2.nope', {}), /no message/);
});

test('scroll effects: valid CSS, guarded, timeline after the shorthand, only #wrapper selectors', async () => {
  const { plugins } = await import('../src/index.js');
  for (const use of ['reveal', 'progress', 'parallax']) {
    const css = plugins[use]({}, null, {}).join('');
    assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{@supports \(animation-timeline:/);
    assert.match(css, /[{;]animation:[^;}]*;animation-timeline:/, use);
    assert.match(css, /@keyframes custom-/);
    assert.deepEqual(validate(css, 'profile').filter((p) => p.level === 'error'), [], use);
  }
  assert.match(plugins.progress({ color: '#d6336c', height: 6 }).join(''), /height:6px.*background:#d6336c/);
  assert.throws(() => plugins.progress({ color: 'red;}' }), /color/);
  assert.throws(() => plugins.progress({ height: 11 }), /height/);
});
