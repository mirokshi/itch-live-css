// Tab through a JS-enabled jam overview harness and record every focus stop.
// usage: CDP_PORT=9612 CDP_BLOCK_ITCH=1 node jamfocus.mjs <file:///page.html> <out.json> [maxStops=400] [width=1280]
import { openPage } from '../a11y-tests/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [url, outFile, maxStops = 400, width = 1280] = process.argv.slice(2);
const p = await openPage(url, { width: +width, height: 900 });
await new Promise(r => setTimeout(r, 1500)); // let jam.min.js init (countdown, user tools)
const pre = await p.eval(`({wrapper: !!document.querySelector('#wrapper'), entries: !!document.querySelector('#entries'),
  footerDiv: document.querySelectorAll('.footer').length, itchFooter: document.querySelectorAll('.itch_footer').length,
  editBtn: document.querySelectorAll('.edit_theme_btn').length, skip: !!document.querySelector('.skip_to_main'),
  focusables: document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').length,
  jsInit: typeof window.I === 'object' || typeof window.init_ViewJam === 'function'})`);
const stops = []; let firstKey = null;
for (let i = 0; i < +maxStops; i++) {
  for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await new Promise(r => setTimeout(r, 60));
  const info = await p.eval(`(() => { const a = document.activeElement; if (!a || a === document.body) return null;
    const cs = getComputedStyle(a), r = a.getBoundingClientRect();
    const region = a.closest('.itch_footer') ? 'itch_footer' : a.closest('#entries') ? 'entries' : a.closest('.jam_content') ? 'jam_content'
      : a.closest('.jam_submitter_widget') ? 'submitter' : a.closest('.jam_header_widget') ? 'jam_header' : a.closest('.jam_banner_outer') ? 'banner'
      : a.closest('#wrapper') ? 'wrapper_other' : a.closest('.header_widget') ? 'site_header' : 'outside';
    let bg = 'none', e = a; while (e && e.nodeType === 1) { const c = getComputedStyle(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') { bg = c; break; } e = e.parentElement; }
    let hidden = cs.visibility === 'hidden' || r.width === 0 || r.height === 0; for (let x = a; x && x.nodeType === 1; x = x.parentElement) if (getComputedStyle(x).opacity === '0') hidden = true;
    const key = a.tagName + '|' + (a.getAttribute('href') || '') + '|' + Math.round(r.x + scrollX) + ',' + Math.round(r.y + scrollY);
    return { key, tag: a.tagName.toLowerCase(), cls: (a.className && a.className.baseVal === undefined ? a.className : '').toString().slice(0, 40),
      text: (a.innerText || a.value || '').trim().split(String.fromCharCode(10)).join(' ').slice(0, 40), title: a.getAttribute('title') || '', aria: a.getAttribute('aria-label') || '',
      imgAlt: a.querySelector('img') ? a.querySelector('img').getAttribute('alt') : null, hrefKind: (() => { try { return a.getAttribute('href') ? new URL(a.getAttribute('href'), 'https://itch.io/').host : ''; } catch (e) { return '?'; } })(),
      region, fv: a.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, offset: cs.outlineOffset,
      boxShadow: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 60), bg, hidden, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }; })()`);
  if (!info) { stops.push({ i: i + 1, body: true }); continue; }
  if (firstKey === null) firstKey = info.key; else if (info.key === firstKey) break; // wrapped around
  // accessible name from Chrome's AX tree
  try {
    const { result } = await p.send('Runtime.evaluate', { expression: 'document.activeElement' });
    const ax = await p.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
    const n = ax.nodes[0]; info.role = n.role?.value; info.name = (n.name?.value || '').slice(0, 50);
  } catch (e) { info.name = '?'; }
  stops.push({ i: i + 1, ...info });
}
await p.close();
writeFileSync(outFile, JSON.stringify({ url, width: +width, pre, stops }, null, 1));
const byRegion = {}; for (const s of stops) if (!s.body) byRegion[s.region] = (byRegion[s.region] || 0) + 1;
console.log('PRE', JSON.stringify(pre));
console.log('STOPS', stops.length, 'byRegion', JSON.stringify(byRegion));
const order = []; for (const s of stops) { const k = s.body ? 'BODY' : s.region; if (order[order.length - 1] !== k) order.push(k); } console.log('REGION ORDER', order.join(' > '));
const show = (s) => console.log(String(s.i).padStart(3), s.body ? 'BODY' : `${s.region.padEnd(12)} ${s.tag}${s.cls ? '.' + s.cls.split(' ')[0] : ''} role=${s.role} name="${s.name}" fv=${s.fv} outline=${s.outline} off=${s.offset} bg=${s.bg} hidden=${s.hidden} rect=${s.rect}`);
stops.filter((s, k) => k < 25 || s.region === 'itch_footer' || k >= stops.length - 3 || s.hidden || (s.region !== stops[k - 1]?.region)).forEach(show);
