// How newlines in the CSS textarea reach itch's server, using itch's own jQuery (lib.min.js, jQuery 3.6.0).
// Profile and jam editors send JSON.stringify(theme) built from textarea.value; the project editor sends
// I.remote_submit(form), which calls $(form).serializeArray().
// usage: CDP_PORT=9612 node newline.mjs file:///<abs>/newline-test.html
import { openPage } from '../a11y-tests/cdp.mjs';
const p = await openPage(process.argv[2], { width: 800, height: 600 });
await p.eval(`document.getElementById('ta').focus(); true`);
// paste-like insertion of text that contains one CRLF and one LF
await p.send('Input.insertText', { text: 'a{color:red}' + String.fromCharCode(13, 10) + 'b{color:blue}' + String.fromCharCode(10) + 'c{}' });
const r = await p.eval(`(() => {
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const cnt = (s) => ({ len: s.length, CR: s.split(CR).length - 1, LF: s.split(LF).length - 1 });
  const v = document.getElementById('ta').value;
  const json = JSON.stringify({ css: v });
  const ser = $('#f').serializeArray().find(x => x.name === 'layout[css]').value;
  const ta2 = document.getElementById('ta2'); ta2.value = 'x{}' + CR + LF + 'y{}';
  return { jquery: $.fn.jquery, pastedValue: cnt(v), jsonValue: cnt(JSON.parse(json).css), serializeArray: cnt(ser),
           paramEncodedHasCRLF: $.param([{ name: 'layout[css]', value: ser }]).includes('%0D%0A'), setValueCRLF: cnt(ta2.value) };
})()`);
console.log(JSON.stringify(r));
await p.close();
