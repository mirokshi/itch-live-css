"""Gap-fill (section 05, round 2): empty elements per tag and attribute shape. No network, counts only.
Usage: python -I g05r2empty.py <corpus dirs...>
For every container (deduplicated by kind + attribute-order-normalised body) counts elements whose
content is empty ("") or only whitespace/&nbsp; ("ws"), keyed by kind, tag and attribute shape
(custom-class / other-attrs / no-attrs), and the number of distinct pages per key.
"""
import os
import re
import sys
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import g05r2scan as scan  # noqa: E402

EMPTY = re.compile(r'<([a-z][a-z0-9]*)\b([^>]*)>((?:\s|&nbsp;)*)</\1>', re.I)
n, pages, seen = Counter(), defaultdict(set), set()
for f in scan.iter_files(sys.argv[1:]):
    doc = open(f, "rb").read().decode("utf-8", "replace")
    if not (scan.ITCHPATH.search(doc) or scan.OGSITE.search(doc) or scan.CANON.search(doc)):
        continue
    m = scan.CANON.search(doc) or scan.ITCHPATH.search(doc) or scan.OGTITLE.search(doc)
    page = (m.group(1) or m.group(2)) if m else f
    for k, body in scan.containers(doc):
        norm = scan.TAG.sub(lambda t: "<%s%s %s>" % (t.group(1), t.group(2).lower(), " ".join(sorted(t.group(3).split()))), body)
        if (k, hash(norm)) in seen:
            continue
        seen.add((k, hash(norm)))
        for e in EMPTY.finditer(body):
            tag, attrs, inner = e.group(1).lower(), e.group(2), e.group(3)
            if tag in ("iframe", "a", "td", "th", "p", "li"):
                continue
            a = dict(scan.attrs_of(attrs))
            shape = "custom-class" if (a.get("class") or "").startswith("custom") else ("other-attrs" if a else "no-attrs")
            key = (k, tag, shape, "empty" if inner == "" else "ws/nbsp")
            n[key] += 1
            pages[key].add(page)
for key in sorted(n):
    print(f"{key[0]:8} {key[1]:8} {key[2]:13} {key[3]:8} {n[key]:4} elements on {len(pages[key]):3} pages")
