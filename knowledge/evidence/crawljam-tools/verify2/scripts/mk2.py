# usage: python -I mk2.py <raw overview.html> <out.html> <css file or -> [width-independent]
# Builds an offline copy of a jam overview: drops every <script>, points jam.css (any ?version) at tests/jam.css,
# appends the test CSS at the END of style#jam_theme (where itch appends host CSS; any attribute order),
# and injects scripts/probe2.js which prints "V2RESULT {json}".
import re, sys, os
src, out, cust = sys.argv[1:4]
h = open(src, encoding='utf8').read()
h = re.sub(r'<script\b[^>]*>.*?</script>', '', h, flags=re.S)
h, n1 = re.subn(r'https://static\.itch\.io/jam\.css\?\d+', 'jam.css', h)
c = '' if cust == '-' else open(cust, encoding='utf8').read()
h, n2 = re.subn(r'(<style[^>]*id="jam_theme"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + m.group(2) + c + m.group(3), h, count=1, flags=re.S)
assert n1 >= 1 and n2 == 1, (n1, n2)
probe = open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), 'probe2.js'), encoding='utf8').read()
h = h.replace('</body>', '<pre id="v2out"></pre><script>' + probe + '</script></body>')
open(out, 'w', encoding='utf8').write(h)
