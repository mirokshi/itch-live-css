import os, re, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s05check import containers, files
from collections import Counter
props = {}
esc = Counter()
spo = []
for f in files(sys.argv[1:]):
    html = open(f, 'rb').read().decode('utf-8', 'replace')
    css = 'id="custom_css"' in html
    for k, body in containers(html):
        for m in re.finditer(r'<(\w+)[^>]*\sstyle="([^"]*)"', body):
            if 'embed_preload' in m.group(0): continue
            names = tuple(sorted(set(p.split(':')[0].strip() for p in m.group(2).split(';') if ':' in p)))
            props.setdefault(k + (':css' if css else ':nocss'), Counter())[(m.group(1),) + names] += 1
        for m in re.finditer(r'&lt;(/?[A-Za-z][A-Za-z0-9-]*)', body):
            esc[(k, m.group(1).lower())] += 1
        for m in re.finditer(r'<(\w+)([^>]*class="[^"]*\bspoiler\b[^"]*"[^>]*)>', body):
            spo.append((k, os.path.basename(f), m.group(1), re.sub(r'"[^"]{40,}"', '"…"', m.group(2))))
print('STYLE (tag, props):')
for k, c in sorted(props.items()):
    print(' ', k, dict(c.most_common(12)))
print('ESCAPED-TAG TEXT (&lt;name):', dict(esc.most_common(40)))
print('SPOILER:', spo)
