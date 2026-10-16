// One-off probes on a harness page: skip-link target, entry tools on focus, itch_footer.
import { openPage } from '../a11y-tests/cdp.mjs';
const p = await openPage(process.argv[2], { width: 1280, height: 900 });
await new Promise(r => setTimeout(r, 1500));
console.log(JSON.stringify(await p.eval(`(() => {
  const skip = document.querySelector('.skip_to_main');
  const tgt = skip && document.getElementById((skip.getAttribute('href') || '').slice(1));
  const btn = document.querySelector('.game_cell .game_cell_tools .action_btn');
  let tools = null;
  if (btn) { btn.focus(); const t = btn.closest('.game_cell_tools'); const cs = getComputedStyle(t);
    tools = { display: cs.display, opacity: cs.opacity, fv: btn.matches(':focus-visible'), cellFocusWithin: btn.closest('.game_cell').matches(':focus-within') }; }
  const f = document.querySelector('.itch_footer'); let foot = null;
  if (f) { const a = f.querySelector('a'), img = f.querySelector('img'), cs = getComputedStyle(f);
    foot = { inWrapper: !!f.closest('#wrapper'), inEntries: !!f.closest('#entries'), display: cs.display, bg: cs.backgroundColor, linkTitle: a && a.title, imgAlt: img && img.getAttribute('alt'), imgW: img && img.getBoundingClientRect().width, imgComplete: img && img.complete && img.naturalWidth }; }
  return { skipHref: skip && skip.getAttribute('href'), skipTarget: !!tgt, mainEl: !!document.querySelector('main,[role=main]'), tools, foot };
})()`)));
await p.close();
