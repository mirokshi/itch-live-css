// Simulate the documented owner view (leafo, /t/6429680 post 2): body > header + .theme_editor_columns >
// [sidebar] + .theme_editor_primary_column > .jam_page_wrap, with body.theme_editor_open, using itch's real jam.css.
import { openPage } from '../a11y-tests/cdp.mjs';
const p = await openPage(process.argv[2], { width: 1280, height: 900 });
await new Promise(r => setTimeout(r, 1200));
const out = await p.eval(`(() => { const w = document.getElementById('wrapper'); const r = {};
  const snap = (k) => { const pc = document.querySelector('.theme_editor_primary_column');
    r[k] = { bodyChild: document.querySelectorAll('body > #wrapper').length, wrapperMatches: document.querySelectorAll('#wrapper').length,
      docScrollH: document.documentElement.scrollHeight, viewportH: innerHeight,
      column: pc ? { overflowY: getComputedStyle(pc).overflowY, height: Math.round(pc.getBoundingClientRect().height), scrollH: pc.scrollHeight } : null,
      columnsDisplay: pc ? getComputedStyle(pc.parentElement).display : null }; };
  snap('visitor');
  const cols = document.createElement('div'); cols.className = 'theme_editor_columns';
  const side = document.createElement('div'); side.className = 'theme_editor_widget'; side.style.width = '300px';
  const prim = document.createElement('div'); prim.className = 'theme_editor_primary_column';
  w.parentNode.insertBefore(cols, w); cols.append(side, prim); prim.append(w); document.body.classList.add('theme_editor_open');
  snap('owner_editor_open');
  document.body.classList.remove('theme_editor_open'); snap('owner_editor_closed');
  return r; })()`);
console.log(JSON.stringify(out, null, 1));
await p.close();
