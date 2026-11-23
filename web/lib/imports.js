// R10 over the network, for /api/validate: an @import's status and type, from its response headers
// (the body is never read). The URLs come from users' CSS, so the server only calls public hosts:
// https on port 443, every address checked when the connection is made (after redirects too, and with
// no window for DNS to change in between) against private, local and metadata ranges. 3 s per URL in
// all, up to 3 redirects, answers kept 10 minutes (failures 1 minute), at most 200 URLs remembered.

import { lookup } from 'node:dns';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';

const TIMEOUT = 3000;
const TTL = 10 * 60 * 1000;
const RETRY = 60 * 1000;
const MAX_URLS = 200;
const HOPS = 3;
const UA = 'Mozilla/5.0 (compatible; itch-live-css validator)';

const PRIVATE = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3],
]) PRIVATE.addSubnet(net, bits, 'ipv4');
for (const [net, bits] of [
  ['::', 127], ['64:ff9b::', 96], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) PRIVATE.addSubnet(net, bits, 'ipv6');

// an address the server must never call: private, loopback, link-local (cloud metadata), multicast…
// (BlockList matches IPv4-mapped IPv6, ::ffff:7f00:1 too, against the IPv4 ranges)
export const blocked = (address) => PRIVATE.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4');

// dns.lookup for https.request: refuses the connection when any address is blocked
function safeLookup(hostname, options, callback) {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    if (addresses.some((a) => blocked(a.address))) return callback(Object.assign(new Error('private address'), { code: 'BLOCKED' }));
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

// one request: { status, type, location } or { error, reason }
function headers(url, ms) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (u.protocol !== 'https:' || (u.port && u.port !== '443') || (isIP(host) && blocked(host))) return resolve({ error: 'blocked' });
    if (ms <= 0) return resolve({ error: 'timeout' });
    const req = request(u, { method: 'GET', lookup: safeLookup, headers: { 'User-Agent': UA, Accept: 'text/css,*/*;q=0.1' } }, (res) => {
      clearTimeout(timer);
      resolve({ status: res.statusCode, type: res.headers['content-type'] ?? '', location: res.headers.location });
      res.destroy(); // the headers are all it needs
    });
    const timer = setTimeout(() => req.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms);
    req.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'BLOCKED') resolve({ error: 'blocked' });
      else if (err.code === 'TIMEOUT') resolve({ error: 'timeout' });
      else resolve({ error: 'failed', reason: err.code ?? err.message });
    });
    req.end();
  });
}

const cache = new Map(); // url → { res, until }
export async function load(url) {
  const kept = cache.get(url);
  if (kept && Date.now() < kept.until) return kept.res;
  const deadline = Date.now() + TIMEOUT;
  let res;
  for (let at = url, hop = 0; ; hop++) {
    res = await headers(at, deadline - Date.now());
    if (!(res.status >= 300 && res.status < 400 && res.location)) break;
    if (hop === HOPS) {
      res = { error: 'failed', reason: 'too many redirects' };
      break;
    }
    at = new URL(res.location, at).href;
  }
  cache.delete(url); // back of the line: the oldest goes first
  cache.set(url, { res, until: Date.now() + (res.error ? RETRY : TTL) });
  if (cache.size > MAX_URLS) cache.delete(cache.keys().next().value);
  return res;
}
