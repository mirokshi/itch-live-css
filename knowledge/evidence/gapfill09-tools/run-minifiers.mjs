// Gap 09-#44: run several CSS minifiers on the fixture and write one output per setting.
// usage: node run-minifiers.mjs <fixture.css> <outDir> <prefix>
// Packages resolve from a local node_modules (npm i lightningcss browserslist csso@5.0.5 esbuild@0.28.0);
// or point the env vars at absolute install directories (the original run used existing local installs).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LCSS = process.env.LCSS || 'lightningcss';
const BL = process.env.BL || 'browserslist';
const CSSO = process.env.CSSO || 'csso';
const ESB = process.env.ESB || 'esbuild';
const lightningcss = require(LCSS), browserslist = require(BL), csso = require(CSSO), esbuild = require(ESB);
const [src, outDir, prefix] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const code = fs.readFileSync(src, 'utf8');
const versions = {
  lightningcss: require(LCSS + '/package.json').version,
  browserslist: require(BL + '/package.json').version,
  caniuse: require(path.join(BL, '..', 'caniuse-lite', 'package.json')).version,
  csso: require(CSSO + '/package.json').version,
  esbuild: esbuild.version,
};
const query = '>= 0.25%';
const runs = {
  'lightningcss': () => lightningcss.transform({ filename: 'x.css', code: Buffer.from(code), minify: true }),
  'lightningcss-targets': () => lightningcss.transform({ filename: 'x.css', code: Buffer.from(code), minify: true,
    targets: lightningcss.browserslistToTargets(browserslist(query)) }),
  'csso': () => ({ code: csso.minify(code).css }),
  'csso-norestructure': () => ({ code: csso.minify(code, { restructure: false }).css }),
  'esbuild': () => esbuild.transformSync(code, { loader: 'css', minify: true }),
  'esbuild-utf8': () => esbuild.transformSync(code, { loader: 'css', minify: true, charset: 'utf8' }),
};
const report = { versions, query, results: {} };
for (const [name, fn] of Object.entries(runs)) {
  try {
    const r = fn();
    const out = String(r.code);
    fs.writeFileSync(path.join(outDir, `${prefix}.${name}.css`), out, 'utf8');
    report.results[name] = { ok: true, chars: [...out.trimEnd()].length, bytes: Buffer.byteLength(out.trimEnd()),
      warnings: (r.warnings || []).map((w) => (w.text || w.message || JSON.stringify(w)).slice(0, 160)) };
  } catch (e) {
    report.results[name] = { ok: false, error: String(e.message || e).slice(0, 300) };
  }
}
fs.writeFileSync(path.join(outDir, `${prefix}.report.json`), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
