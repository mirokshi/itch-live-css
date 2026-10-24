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
  const long = await (await call({ css: `#wrapper .custom-a{color:red}\n/*${'x'.repeat(6000)}*/` })).json();
  assert.deepEqual(long.problems, []);
});

test('validate: rejects anything but a CSS string', async () => {
  assert.equal((await call({ css: 3 })).status, 400);
  assert.equal((await call({ css: 'a'.repeat(50001) })).status, 400);
  assert.equal((await call(null)).status, 400);
});
