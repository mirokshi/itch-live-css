import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blocked, load } from '../lib/imports.js';

test('imports: private, local and metadata addresses are blocked, public ones are not', () => {
  for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', '::', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '64:ff9b::a00:1']) assert.equal(blocked(a), true, a);
  for (const a of ['8.8.8.8', '151.101.1.1', '172.32.0.1', '2606:4700::1111']) assert.equal(blocked(a), false, a);
});

test('imports: the server never calls anything but https on 443 at a public address', async () => {
  for (const url of [
    'http://example.com/a.css',
    'https://example.com:8443/a.css',
    'https://127.0.0.1/a.css',
    'https://[::1]/a.css',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/a.css', // a name that resolves to a local address: refused when connecting
  ]) assert.deepEqual(await load(url), { error: 'blocked' }, url);
});

test('imports: 20 requests a minute per caller; refused URLs and cached answers cost nothing', async () => {
  for (let i = 0; i < 25; i++) assert.deepEqual(await load(`http://x.test/${i}.css`, '203.0.113.1'), { error: 'blocked' }); // never sent
  for (let i = 0; i < 20; i++) assert.deepEqual(await load(`https://localhost/limit-${i}.css`, '203.0.113.1'), { error: 'blocked' }, `${i}`);
  assert.deepEqual(await load('https://localhost/limit-20.css', '203.0.113.1'), { error: 'limited' });
  assert.deepEqual(await load('https://localhost/limit-0.css', '203.0.113.1'), { error: 'blocked' }); // kept from before
  assert.deepEqual(await load('https://localhost/limit-21.css', '203.0.113.2'), { error: 'blocked' }); // another caller
});
