"""Gap-fill (section 05, round 2): iframe census by host and attribute set. No network, counts only.
Usage: python -I g05r2iframes.py <corpus dirs...>
Live <iframe> tags in containers and iframes stored inside itch's click-to-activate placeholders
(data-embed_code), deduplicated by (kind, page, normalised tag). Prints host x attribute-set counts.
"""
import html as H
import re
import sys
from collections import Counter
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import g05r2scan as scan  # noqa: E402

c, seen = Counter(), set()
for f in scan.iter_files(sys.argv[1:]):
    doc = open(f, "rb").read().decode("utf-8", "replace")
    if not (scan.ITCHPATH.search(doc) or scan.OGSITE.search(doc) or scan.CANON.search(doc)):
        continue
    m = scan.CANON.search(doc) or scan.ITCHPATH.search(doc) or scan.OGTITLE.search(doc)
    page = (m.group(1) or m.group(2)) if m else f
    for k, body in scan.containers(doc):
        tags = [("live", t) for t in re.findall(r"<iframe\b[^>]*>", body, re.I)]
        for b in re.findall(r'data-embed_code="([^"]*)"', body):
            tags += [("placeholder", t) for t in re.findall(r"<iframe\b[^>]*>", H.unescape(b), re.I)]
        for where, t in tags:
            a = scan.attrs_of(t[len("<iframe"):-1])
            names = tuple(sorted(n for n, _ in a))
            src = dict(a).get("src") or ""
            host = re.sub(r"^(https?:)?//", "", src).split("/")[0].lower()
            host = "youtube" if "youtube" in host or "youtu.be" in host else host
            key = (k, page, where, tuple(sorted(a)))
            if key in seen:
                continue
            seen.add(key)
            c[(k, where, host, " ".join(names))] += 1
for (k, where, host, names), n in sorted(c.items()):
    print(f"{k:8} {where:11} {n:4}  {host:28} {names}")
