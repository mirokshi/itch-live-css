// Does #wrapper{--itchio_input_focus_color} recolor focus rings on a jam overview? Appends the rule after host CSS.
import { openPage } from '../a11y-tests/cdp.mjs';
const p = await openPage(process.argv[2], { width: 1280, height: 900 });
await p.send('Emulation.setFocusEmulationEnabled', { enabled: true }); await new Promise(r => setTimeout(r, 1200));
const out = await p.eval(`(() => { const st = document.getElementById('jam_theme'); const res = {};
  const pick = { contentLink: '#wrapper .jam_content a[href]', headerTab: '#wrapper .header_tab', button: '#wrapper .jam_submitter_widget .button', entryTitle: '#wrapper #entries .game_title a' };
  for (const v of ['before', 'after']) { if (v === 'after') st.textContent += '#wrapper{--itchio_input_focus_color:#ffc857}';
    for (const [k, sel] of Object.entries(pick)) { const el = document.querySelector(sel); if (!el) continue; el.focus({ focusVisible: true });
      res[v + ':' + k] = el.matches(':focus') + ' ' + getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineColor; } }
  return res; })()`);
console.log(JSON.stringify(out));
await p.close();
