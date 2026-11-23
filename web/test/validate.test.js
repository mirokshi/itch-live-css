import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST } from '../api/validate.js';

const call = (body) => POST(new Request('https://x.test/api/validate', { method: 'POST', body: JSON.stringify(body) }));

test('validate: engine problems with the rule title from the knowledge base', async () => {
  const res = await call({ css: 'body{color:red}\n@keyframes spin{to{rotate:1turn}}' });
  assert.equal(res.status, 200);
  const { problems } = await res.json();
  const r2 = problems.find((p) => p.rule === 'R2');
  const r16 = problems.find((p) => p.rule === 'R16');
  assert.equal(r2.level, 'error');
  assert.match(r2.title, /#wrapper/);
  assert.match(r16.message, /spin/);
  assert.match(r16.title, /custom-/);
  // served through the link: no profile size check, however long
  const ring = '#wrapper :focus-visible{outline:2px solid}'; // R19
  const long = await (await call({ css: `#wrapper .custom-a{color:red}${ring}\n/*${'x'.repeat(6000)}*/` })).json();
  assert.deepEqual(long.problems, []);
});

test("validate: with the user's HTML it counts the page's h1s (R20)", async () => {
  const codes = async (body) => (await (await call({ css: '', ...body })).json()).problems.map((p) => p.code);
  const h1 = '<h1 class="custom-title">Me</h1>';
  assert.deepEqual(await codes({ page: 'profile', html: h1 }), ['R20.many']); // itch's own shows too
  assert.deepEqual(await codes({ page: 'profile', html: h1, banner: true }), []);
  assert.deepEqual(await codes({ page: 'project', html: h1, html5: true }), []);
  assert.deepEqual(await codes({ page: 'project', html: '<p>x</p>', html5: true }), ['R20.none']);
  assert.deepEqual(await codes({ page: 'project' }), []); // no HTML, no count
  // R11: what itch strips from the HTML
  assert.deepEqual(await codes({ page: 'profile', html: '<p class="note" id="n">x</p>', banner: true }), ['R11.class', 'R11.attr', 'R20.none']);
  assert.equal((await call({ css: '', html: 3 })).status, 400);
});

test('validate: a jam is checked as pasted, and its @imports never load there', async () => {
  const codes = async (css) => (await (await call({ css, page: 'jam' })).json()).problems.map((p) => p.code);
  assert.deepEqual(await codes('@import url("https://a.test/x.css");#wrapper :focus-visible{outline:2px solid}'), ['R9.jam']);
  assert.deepEqual(await codes(`#wrapper :focus-visible{outline:2px solid}#wrapper{--x:"${'a'.repeat(20410)}"}`), ['R7.jam']);
  assert.deepEqual(await codes('#wrapper h1{color:red}#wrapper :focus-visible{outline:2px solid}'), ['R20.jam']);
});

test('validate: rejects anything but a CSS string', async () => {
  assert.equal((await call({ css: 3 })).status, 400);
  assert.equal((await call({ css: 'a'.repeat(50001) })).status, 400);
  assert.equal((await call(null)).status, 400);
  assert.equal((await call({ css: '', page: 'forum' })).status, 400);
});
