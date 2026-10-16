"""Section-05 ad-hoc checks, consolidated (no network; counts only).

Usage: python -I s05extra.py <dir-or-file> [...]
  1. class-token census per container kind (custom-*, custom_*, custom[a-z]*, itch tokens)
  2. inline style values: custom-property declarations (--x), var(), url()
  3. empty elements carrying a custom* class (<div class="custom-x"></div>)
  4. <a> without href: with/without name, with/without injected rel
"""
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s05check import TAG, containers, files  # noqa: E402

classes = defaultdict(Counter)
style = Counter()
empty = Counter()
anchors = Counter()
seen = set()
for f in files(sys.argv[1:]):
    html = open(f, "rb").read().decode("utf-8", "replace")
    for k, body in containers(html):
        if (k, hash(body)) in seen:
            continue
        seen.add((k, hash(body)))
        for m in re.finditer(r'\sclass="([^"]*)"', body):
            for t in m.group(1).split():
                g = ("custom-*" if t.startswith("custom-") else "custom_*" if t.startswith("custom_")
                     else "custom[a-z]*" if t.startswith("custom") else t)
                classes[k][g] += 1
        for m in re.finditer(r'<(\w+)([^>]*)\sstyle="([^"]*)"', body):
            if "embed_preload" in m.group(2):
                continue
            v = m.group(3)
            if re.search(r"(^|;\s*)--", v):
                style[(k, "custom-property decl")] += 1
            if "var(" in v:
                style[(k, "var()")] += 1
            if "url(" in v:
                style[(k, "url()")] += 1
        for m in re.finditer(r'<(span|div|p)\s+class="(custom[^"]*)"\s*>\s*</\1>', body):
            empty[(k, m.group(1))] += 1
        for t in TAG.finditer(body):
            if t.group(1) or t.group(2) != "a" or "href=" in t.group(3):
                continue
            a = t.group(3)
            anchors[(k, "name" if "name=" in a else "no-name", "rel" if "rel=" in a else "no-rel")] += 1

print("CLASSES:", {k: dict(v.most_common(15)) for k, v in classes.items()})
print("STYLE:", dict(style))
print("EMPTY custom elements:", dict(empty))
print("HREF-LESS <a>:", dict(anchors))
