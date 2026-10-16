// smoke.mjs <url> <snapshot> - load one page through lr.mjs with EMPTY custom CSS and print what itch's JS changed.
import { open } from './lr.mjs';
const [url, snapshot] = process.argv.slice(2);
const p = await open({ url, snapshot, inject: { mode: 'custom_css', css: '' } }, { width: 1280, height: 900 });
console.log(JSON.stringify(await p.eval(`(() => {
  const w = document.getElementById('wrapper');
  const heads = [...document.head.children].map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.hasAttribute('itchio-grid-sizer') ? '[itchio-grid-sizer]' : '')).filter(s => s.startsWith('style'));
  const imgs = [...document.querySelectorAll('img')];
  return {
    jQuery: typeof window.$, I: typeof window.I,
    headStyles: heads,
    sizers: [...document.querySelectorAll('style[itchio-grid-sizer]')].map(s => s.textContent.replace(/\s+/g, ' ').trim()),
    wrapperInline: w && w.getAttribute('style'),
    userTools: (() => { const u = document.getElementById('user_tools'); if (!u) return null; const cs = getComputedStyle(u); return { cls: u.className, opacity: cs.opacity, transform: cs.transform, position: cs.position, rect: u.getBoundingClientRect().toJSON() }; })(),
    imgs: { total: imgs.length, withLazyAttr: imgs.filter(i => i.dataset.lazy_src).length, lazyWithSrc: imgs.filter(i => i.dataset.lazy_src && i.getAttribute('src')).length, complete: imgs.filter(i => i.complete && i.naturalWidth > 0).length },
    gridCols: [...document.querySelectorAll('.game_grid_widget')].map(g => ({ cls: g.className, cols: getComputedStyle(g).gridTemplateColumns, gap: getComputedStyle(g).columnGap + ' / ' + getComputedStyle(g).rowGap })),
    scrollW: document.documentElement.scrollWidth,
  };
})()`), null, 1));
console.log('stats', JSON.stringify(p.stats));
await p.close();
