# usage: python -I mkjam.py <saved jam overview html> <out html>
# Builds a local page holding the saved style#jam_theme verbatim (scratchpad only) plus a synthetic
# "theme rules then host CSS" sheet, and a script that reports CSSOM rule types and font registration.
import sys, re, html
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8', errors='replace').read()
m = re.search(r'<style[^>]*id="jam_theme"[^>]*>(.*?)</style>', s, re.S)
css = m.group(1)
imp_at = css.find('@import')
page = """<!DOCTYPE html><html><head><meta charset="utf-8">
<style id="jam_theme">""" + css + """</style>
<style id="synthetic">.view_jam_page .jam_body{background-color:rgb(1,1,1)}
@import url("data:text/css,.probe{color:rgb(9,9,9)}");
@font-face{font-family:"S06Probe";src:url("data:font/woff2;base64,AAAA")}
#wrapper .probe2{color:rgb(4,4,4)}</style>
</head><body><div id="wrapper"><p class="probe">p</p><p class="probe2">p2</p></div>
<section id="results"></section>
<script>
const types = id => Array.from(document.getElementById(id).sheet.cssRules).map(r => r.constructor.name);
const count = (a, n) => a.filter(x => x === n).length;
const jt = types('jam_theme'), sy = types('synthetic');
const fonts = Array.from(document.fonts).map(f => f.family);
const rows = [
  ['J1', 'jam_theme: total CSSOM rules', jt.length],
  ['J2', 'jam_theme: CSSImportRule count', count(jt, 'CSSImportRule')],
  ['J3', 'jam_theme: source offset of "@import" text', IMPAT],
  ['J4', 'synthetic: rule types', sy.join(',')],
  ['J5', 'synthetic: .probe color (rgb(9,9,9) = late @import applied)', getComputedStyle(document.querySelector('.probe')).color],
  ['J6', 'synthetic: rule after the dropped @import still applies (.probe2)', getComputedStyle(document.querySelector('.probe2')).color],
  ['J7', 'document.fonts families (late @font-face registered?)', fonts.join('|')],
  ['UA', navigator.userAgent, '']
];
document.getElementById('results').innerHTML = '<table>' + rows.map(r => '<tr class="r-INFO"><td>' + r[0] + '</td><td>INFO</td><td>' + r[1] + '</td><td>-</td><td>' + r[2] + '</td></tr>').join('') + '</table>';
</script></body></html>""".replace('IMPAT', str(imp_at))
open(out, 'w', encoding='utf-8').write(page)
print('jam_theme chars', len(css), '@import offset', imp_at)
