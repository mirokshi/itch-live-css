// Builds the small repository users fork to run their own service (mirokshi/itch-live-css-service):
// only what /live.css needs, with the service at the root, so Vercel needs no Root Directory.
//   node service/publish.mjs <out-dir>
// <out-dir> is emptied first, except its .git, so it can be a checkout of that repository
// (.github/workflows/service-repo.yml does this on every push to main).
// config.json is the file users replace: change the example only when needed, since a change makes
// "Sync fork" conflict for everyone who edited theirs.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] ?? '');
if (!process.argv[2] || out === root || root.startsWith(out)) throw new Error('usage: node service/publish.mjs <out-dir> (not the repo itself)');

const NAME = 'itch-live-css-service';
const read = (p) => readFileSync(join(root, p), 'utf8');
function write(p, text) {
  mkdirSync(dirname(join(out, p)), { recursive: true });
  writeFileSync(join(out, p), text);
}
// copy with the import paths of the new layout; every rewrite must apply, so a moved file fails here
function copy(from, to, swaps = []) {
  let text = read(from);
  for (const [a, b] of swaps) {
    if (!text.includes(a)) throw new Error(`${from}: "${a}" not found`);
    text = text.replaceAll(a, b);
  }
  write(to, text);
}

mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f !== '.git') rmSync(join(out, f), { recursive: true });

const toLib = [["'../../web/lib/", "'../lib/"]];
copy('service/api/live.js', 'api/live.js', toLib);
copy('service/api/bio.js', 'api/bio.js', toLib);
copy('service/config.json', 'config.json');
copy('service/README.md', 'README.md');
copy('LICENSE', 'LICENSE');
copy('web/lib/config.js', 'lib/config.js', [["'../../engine/src/", "'../engine/"], ["'../src/ideas.js'", "'./ideas.js'"]]);
copy('web/lib/googlefonts.js', 'lib/googlefonts.js', [["'../../engine/src/", "'../engine/"]]);
for (const f of ['fonts.js', 'http.js', 'itch.js']) copy(`web/lib/${f}`, `lib/${f}`);
copy('web/src/ideas.js', 'lib/ideas.js');
cpSync(join(root, 'engine/src'), join(out, 'engine'), { recursive: true });

const engine = JSON.parse(read('engine/package.json'));
write('package.json', `${JSON.stringify({
  name: NAME,
  version: '0.0.0',
  private: true,
  description: 'Your own itch-live-css service: per-visit CSS for your itch.io page, on your Vercel account.',
  license: 'MIT',
  type: 'module',
  engines: engine.engines,
  dependencies: engine.dependencies,
}, null, 2)}\n`);
const lock = JSON.parse(read('engine/package-lock.json'));
lock.name = lock.packages[''].name = NAME;
write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
const { installCommand, ...vercel } = JSON.parse(read('service/vercel.json')); // the engine is inside now
write('vercel.json', `${JSON.stringify(vercel, null, 2)}\n`);
write('.gitignore', 'node_modules/\n.vercel/\n');

// every relative import must land on a file of the new layout
const files = (d) => readdirSync(join(out, d), { withFileTypes: true }).flatMap((e) =>
  e.name === '.git' || e.name === 'node_modules' ? [] : e.isDirectory() ? files(join(d, e.name)) : [join(d, e.name)]);
for (const f of files('.').filter((f) => f.endsWith('.js'))) {
  for (const [, spec] of readFileSync(join(out, f), 'utf8').matchAll(/(?:from|import)\s*\(?\s*'(\.{1,2}\/[^']+)'/g)) {
    if (!existsSync(join(out, dirname(f), spec))) throw new Error(`${f}: import '${spec}' points outside the new layout`);
  }
}
console.log(`ok: ${files('.').length} files → ${relative(process.cwd(), out) || '.'}`);
