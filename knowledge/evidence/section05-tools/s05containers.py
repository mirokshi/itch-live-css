"""Exact class strings of user-content containers, per kind (counts per page)."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s05check import OPEN_DIV, kind_of, files
from collections import Counter
c = Counter()
for f in files(sys.argv[1:]):
    html = open(f, 'rb').read().decode('utf-8', 'replace')
    kinds = set()
    for m in OPEN_DIV.finditer(html):
        k = kind_of(m.group(2).split())
        if k and k != 'comment':
            cls = m.group(1) + ' ' + ' '.join(sorted(m.group(2).split()))
            kinds.add((k, cls))
    for x in kinds: c[x] += 1
for (k, cls), n in sorted(c.items()): print(f'{k:8} {n:4}  .{cls.replace(" ", ".")}')
