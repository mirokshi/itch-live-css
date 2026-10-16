"""Count attribute serialization forms inside stored user-content containers."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s05check import containers, files, TAG
from collections import Counter
ATTR = re.compile(r'\s([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s"\'>]+))?')
c = Counter(); ex = Counter(); seen = set()
for f in files(sys.argv[1:]):
    html = open(f, 'rb').read().decode('utf-8', 'replace')
    for k, body in containers(html):
        if (k, hash(body)) in seen: continue
        seen.add((k, hash(body)))
        for t in TAG.finditer(body):
            if t.group(1) or t.group(2) == 'button': continue
            c[(k, 'tags')] += 1
            attrs = t.group(3).rstrip('/')
            for a in ATTR.finditer(attrs):
                v = a.group(2)
                if v is None: c[(k, 'bare')] += 1; ex[(k, t.group(2), a.group(1), 'bare')] += 1
                elif v[0] == '"': c[(k, 'dq')] += 1
                elif v[0] == "'": c[(k, 'sq')] += 1; ex[(k, t.group(2), a.group(1), 'sq')] += 1
                else: c[(k, 'unquoted')] += 1; ex[(k, t.group(2), a.group(1), 'unq')] += 1
            if t.group(0).endswith('/>'): c[(k, 'selfclose')] += 1; ex[(k, t.group(2), '/>', '')] += 1
            if '  ' in t.group(3): c[(k, 'double_space_in_tag')] += 1
for k in sorted(c): print(k, c[k])
print(ex.most_common(30))
