"""Gap-fill (section 05, round 2): attribute-name census on authored tags. No network, counts only.
Usage: python -I g05r2attrs.py <corpus dirs...>
Containers deduplicated by (kind, attribute-order-normalised body); itch's own embed placeholders
(button.embed_preload and its div.embed_url) excluded. Prints kind, attribute name, count, tags.
"""
import os
import re
import sys
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import g05r2scan as scan  # noqa: E402

c, tags, seen, ntags = Counter(), defaultdict(Counter), set(), Counter()
for f in scan.iter_files(sys.argv[1:]):
    doc = open(f, "rb").read().decode("utf-8", "replace")
    if not (scan.ITCHPATH.search(doc) or scan.OGSITE.search(doc) or scan.CANON.search(doc)):
        continue
    for k, body in scan.containers(doc):
        norm = scan.TAG.sub(lambda t: "<%s%s %s>" % (t.group(1), t.group(2).lower(), " ".join(sorted(t.group(3).split()))), body)
        if (k, hash(norm)) in seen:
            continue
        seen.add((k, hash(norm)))
        for t in scan.TAG.finditer(body):
            if t.group(1):
                continue
            tag, raw = t.group(2).lower(), t.group(3)
            if (tag == "button" and "embed_preload" in raw) or 'class="embed_url"' in raw:
                continue
            ntags[k] += 1
            for n, _ in scan.attrs_of(raw):
                c[(k, n)] += 1
                tags[(k, n)][tag] += 1
print("authored opening tags per kind:", dict(ntags))
for (k, n), v in sorted(c.items(), key=lambda x: (x[0][0], -x[1])):
    print(f"{k:8} {n:22} {v:6}  {dict(tags[(k, n)].most_common(8))}")
