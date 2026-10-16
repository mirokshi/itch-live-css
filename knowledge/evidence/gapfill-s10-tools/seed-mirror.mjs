// seed-mirror.mjs - put same-day logged-out copies of itch's static files into the lr.mjs mirror,
// so the live render does not re-download them. Usage: LR_MIRROR=<dir> node seed-mirror.mjs <url>=<file> ...
// (pairs are split on the LAST "=" that is followed by a path, so base64 "==" in URLs is safe)
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const MIRROR = process.env.LR_MIRROR; fs.mkdirSync(MIRROR, { recursive: true });
const types = { css: 'text/css', js: 'application/x-javascript', jpg: 'image/jpeg', png: 'image/png' };
for (const arg of process.argv.slice(2)) {
  const i = arg.lastIndexOf('=>'); const url = arg.slice(0, i), file = arg.slice(i + 2);
  const ext = new URL(url).pathname.split('.').pop();
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 20);
  fs.copyFileSync(file, path.join(MIRROR, key + '.bin'));
  fs.writeFileSync(path.join(MIRROR, key + '.json'), JSON.stringify({ url, status: 200, headers: { 'content-type': types[ext] || 'application/octet-stream', 'access-control-allow-origin': '*' }, seededFrom: path.basename(file), fetchedAt: fs.statSync(file).mtime.toISOString() }));
  console.log('seeded', url, fs.statSync(file).size);
}
