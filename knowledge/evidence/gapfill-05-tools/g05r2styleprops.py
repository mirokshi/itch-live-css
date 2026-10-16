"""Gap-fill (section 05, round 2): inline-style property census with value shapes. No network.
Usage: python -I g05r2styleprops.py <corpus dirs...>
Authored style attributes in deduplicated containers. For each property: declarations, distinct
pages, and value shapes (url / hex / function / keyword / number) - no raw values printed.
"""
import os
import re
import sys
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import g05r2scan as scan  # noqa: E402

CSS27 = scan.CSS27
decl, pages, shapes, seen = Counter(), defaultdict(set), defaultdict(Counter), set()
attrs_total, attrs_empty = Counter(), Counter()


def shape(v):
    v = v.strip()
    if v.startswith("url("):
        return "url"
    if v.startswith("#"):
        return "hex"
    if re.match(r"^[a-z-]+\(", v):
        return "function"
    if re.match(r"^-?[\d.]", v):
        return "number"
    return "keyword"


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
        for t in scan.TAG.finditer(body):
            if t.group(1):
                continue
            raw = t.group(3)
            if (t.group(2).lower() == "button" and "embed_preload" in raw) or 'class="embed_url"' in raw:
                continue
            for n, v in scan.attrs_of(raw):
                if n != "style" or v is None:
                    continue
                attrs_total[k] += 1
                if not v.strip():
                    attrs_empty[k] += 1
                for d in v.split(";"):
                    if ":" not in d:
                        continue
                    p, val = d.split(":", 1)
                    p = p.strip().lower()
                    decl[p] += 1
                    pages[p].add(page)
                    shapes[p][shape(val)] += 1
print("style attributes per kind:", dict(attrs_total), " empty:", dict(attrs_empty))
print(f"distinct properties: {len(decl)}; on the 27-list: {sum(1 for p in decl if p in CSS27)}; outside: {[p for p in decl if p not in CSS27]}")
print("27-list properties never seen:", [p for p in CSS27 if p not in decl])
for p, n in decl.most_common():
    print(f"{p:18} {n:5} decl on {len(pages[p]):3} pages  {dict(shapes[p])}")
