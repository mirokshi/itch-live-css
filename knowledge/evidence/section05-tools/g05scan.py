"""Gap-fill scan for section 05 (no network; counts only, no third-party content printed
unless --contexts FILE is given, which writes short contexts to a scratch file for manual review).

Usage: python -I g05scan.py [--contexts OUT.txt] <dir-or-file> [...]

Over every user-content container (bio, project, devlog, jam, comment; same detection as s05check.py),
deduplicated by (kind, canonical page URL, body hash), it reports:
  1. escaped-tag text (&lt;tag / &lt;/tag) by tag name, split into inside <code>/<pre> vs outside
  2. class tokens: uppercase letters, characters outside [a-z0-9_-], case-variants of "custom"
  3. attribute-name census on user-authored elements (itch's own embed buttons excluded)
  4. empty elements carrying a custom* class, per tag; empty attribute-less <span>
  5. inline style values containing a custom-property declaration or var()
  6. iframes / embed placeholders per kind; bios with iframes
  7. HTML comments: escaped (&lt;!--) and raw (<!--)
  8. bio length census (stored chars, UTF-8 bytes, estimate without itch's injected attributes)
"""
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s05check import TAG, containers  # noqa: E402

CANON = re.compile(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="canonical"')
ESC = re.compile(r'&lt;(/?)([A-Za-z][A-Za-z0-9-]*)')
CODE_SPAN = re.compile(r'<(code|pre)\b[^>]*>.*?</\1>', re.S | re.I)
INJECT = [' loading="lazy"', ' rel="nofollow noopener" referrerpolicy="origin"']


def iter_files(args):
    for a in args:
        if os.path.isdir(a):
            for root, _dirs, names in os.walk(a):
                for n in names:
                    if n.endswith((".html", ".htm")):
                        yield os.path.join(root, n)
        elif os.path.isfile(a):
            yield a


def main():
    argv = sys.argv[1:]
    ctx_out = None
    if argv and argv[0] == "--contexts":
        ctx_out = open(argv[1], "w", encoding="utf-8")
        argv = argv[2:]
    seen = set()
    n_files = 0
    kinds = Counter()
    esc = defaultdict(Counter)          # kind -> "tag:in_code|outside" -> n
    esc_pages = defaultdict(set)        # tag -> pages (outside code)
    cls = defaultdict(Counter)
    cls_examples = defaultdict(set)
    attrs = defaultdict(Counter)
    empty = defaultdict(Counter)
    style = defaultdict(Counter)
    iframes = defaultdict(Counter)
    comments = defaultdict(Counter)
    bios = {}
    for f in iter_files(argv):
        html = open(f, "rb").read().decode("utf-8", "replace")
        if "user_formatted" not in html and "user_profile" not in html:
            continue
        n_files += 1
        m = CANON.search(html)
        page = (m.group(1) or m.group(2)) if m else os.path.basename(f)
        for k, body in containers(html):
            key = (k, page, hashlib.sha1(body.encode("utf-8")).hexdigest())
            if key in seen:
                continue
            seen.add(key)
            kinds[k] += 1
            # 1. escaped tags
            code_ranges = [(c.start(), c.end()) for c in CODE_SPAN.finditer(body)]
            for e in ESC.finditer(body):
                inside = any(a <= e.start() < b for a, b in code_ranges)
                name = e.group(2).lower()
                esc[k][f"{name}:{'code' if inside else 'outside'}"] += 1
                if not inside:
                    esc_pages[name].add(page)
                    if ctx_out:
                        s = max(0, e.start() - 80)
                        ctx_out.write(f"[{k}] {page} :: {body[s:e.end() + 120]!r}\n")
            # 2/3. tags: classes + attribute census (skip itch's own embed placeholders)
            for t in TAG.finditer(body):
                if t.group(1):
                    continue
                tag, a = t.group(2).lower(), t.group(3)
                if tag == "button" and "embed_preload" in a:
                    continue
                if 'class="embed_url"' in a:
                    continue
                for an in re.findall(r'\s([^\s=/>"\']+)(?==|\s|/?$)', a):
                    attrs[k][an.lower()] += 1
                for cm in re.finditer(r'\sclass="([^"]*)"', a):
                    for tok in cm.group(1).split():
                        if tok != tok.lower():
                            cls[k]["has-uppercase"] += 1
                            cls_examples["has-uppercase"].add(tok[:40])
                        if re.search(r"[^a-z0-9_-]", tok.lower()):
                            cls[k]["non-[a-z0-9_-]-char"] += 1
                            cls_examples["non-[a-z0-9_-]-char"].add(tok[:40])
                        if tok.lower().startswith("custom") and not tok.startswith("custom"):
                            cls[k]["Custom-case-variant"] += 1
                            cls_examples["Custom-case-variant"].add(tok[:40])
                        if tok == "":
                            cls[k]["empty-token"] += 1
                    if cm.group(1).strip() == "":
                        cls[k]["empty-class-attr"] += 1
            # 4. empty hook elements
            for em in re.finditer(r'<([a-z0-9]+)\s+class="(custom[^"]*)"\s*>((?:\s|&nbsp;)*)</\1>', body):
                empty[k][f"{em.group(1)}{'+ws' if em.group(3) else ''}"] += 1
            empty[k]["bare-empty-span"] += len(re.findall(r'<span>\s*</span>', body))
            # 5. inline style
            for sm in re.finditer(r'<(\w+)([^>]*)\sstyle="([^"]*)"', body):
                if "embed_preload" in sm.group(2):
                    continue
                v = sm.group(3)
                if re.search(r"(^|;\s*)--", v):
                    style[k]["custom-property-decl"] += 1
                if "var(" in v:
                    style[k]["var()"] += 1
            # 6. iframes
            iframes[k]["iframe"] += len(re.findall(r"<iframe\b", body, re.I))
            iframes[k]["placeholder"] += len(re.findall(r"<button[^>]*embed_preload", body))
            # 7. comments
            comments[k]["escaped &lt;!--"] += body.count("&lt;!--")
            comments[k]["raw <!--"] += body.count("<!--")
            # 8. bio lengths
            if k == "profile":
                est = body
                for s in INJECT:
                    est = est.replace(s, "")
                rec = {"chars": len(body), "utf8": len(body.encode("utf-8")), "no_inject": len(est),
                       "no_inject_unescaped": len(est.replace("&#x27;", "'").replace("&quot;", '"').replace("&gt;", ">")),
                       "nonascii": sum(1 for ch in body if ord(ch) > 127),
                       "iframes": body.count("<iframe")}
                prev = bios.get(page)
                if not prev or rec["chars"] > prev["chars"]:
                    bios[page] = rec
    lens = sorted(b["no_inject"] for b in bios.values())
    out = {
        "files_with_containers": n_files,
        "containers": kinds,
        "escaped_tags": {k: dict(sorted(v.items())) for k, v in esc.items()},
        "escaped_outside_code_pages": {t: len(p) for t, p in sorted(esc_pages.items())},
        "class_tokens": {k: dict(v) for k, v in cls.items()},
        "class_token_examples_counts": {k: len(v) for k, v in cls_examples.items()},
        "attribute_names": {k: dict(v.most_common()) for k, v in attrs.items()},
        "empty_custom_elements": {k: dict(v) for k, v in empty.items()},
        "style": {k: dict(v) for k, v in style.items()},
        "iframes": {k: dict(v) for k, v in iframes.items()},
        "comments": {k: dict(v) for k, v in comments.items()},
        "bios": {
            "unique_profiles": len(bios),
            "with_iframe": sum(1 for b in bios.values() if b["iframes"]),
            "max": max(bios.values(), key=lambda b: b["chars"]) if bios else None,
            "top10_no_inject": lens[-10:],
            "over_5000_stored_chars": sum(1 for b in bios.values() if b["chars"] > 5000),
            "over_5000_no_inject": sum(1 for b in bios.values() if b["no_inject"] > 5000),
            "over_5000_no_inject_unescaped": sum(1 for b in bios.values() if b["no_inject_unescaped"] > 5000),
            "over_5000_utf8": sum(1 for b in bios.values() if b["utf8"] > 5000),
            "between_4500_5000_no_inject": sum(1 for b in bios.values() if 4500 <= b["no_inject"] <= 5000),
        },
    }
    if ctx_out:
        ctx_out.write("\nCLASS EXAMPLES (scratch only)\n")
        for k, v in cls_examples.items():
            ctx_out.write(f"{k}: {sorted(v)[:60]}\n")
        ctx_out.write("\nBIOS\n")
        for p, b in sorted(bios.items(), key=lambda x: -x[1]["chars"])[:25]:
            ctx_out.write(f"{p} {b}\n")
        ctx_out.close()
    print(json.dumps(out, indent=1, default=dict))


if __name__ == "__main__":
    main()
