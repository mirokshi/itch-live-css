"""Gap-fill (section 05, round 2) corpus scan. No network. Prints counts only.

Usage: python -I g05r2scan.py [--contexts OUT.txt] <dir-or-file> [...]

Walks every *.html under the given paths, extracts itch user-content containers
(bio, project description, devlog post, jam description, comment), deduplicates
them by (kind, canonical URL, body hash) and reports:

  spans      empty <span ...></span> (by attribute shape and by parent heading),
             attribute-less non-empty <span>, whitespace-only spans,
             headings that contain >=2 spans, other empty inline tags
  classes    every class token classified (custom-*, custom_*, customX, Custom*,
             text-*, itch-generated, other) plus tokens with uppercase or
             characters outside [a-z0-9_-], tokens starting with '-', empty class=""
  attrs      attribute-name census on authored elements (itch's embed buttons
             and their inner embed_url div excluded): popover*, aria-*, role, id,
             data-*, tabindex, on*
  style      inline-style property census (authored elements only)
  iframes    attribute names on live <iframe> tags per kind, plus attribute names
             on the iframe stored inside each placeholder's data-embed_code
  added      attributes on itch-added tags (details summary figure figcaption del
             ruby rt rp font)

--contexts writes short snippets to a scratch file for manual review (never commit it).
"""
import hashlib
import html as htmlmod
import json
import os
import re
import sys
from collections import Counter, defaultdict

KINDS = [
    ("profile", {"user_profile", "formatted"}),
    ("project", {"formatted_description", "user_formatted"}),
    ("devlog", {"post_body", "user_formatted", "object_text_widget_widget"}),
    ("jam", {"jam_content", "user_formatted"}),
    ("comment", {"post_body", "user_formatted"}),
]
OPEN = re.compile(r'<(div|section)\b[^>]*\bclass="([^"]*)"[^>]*>', re.I)
TAG = re.compile(r'<(/?)([A-Za-z][A-Za-z0-9]*)\b([^>]*)>', re.S)
ATTR = re.compile(r'\s([^\s=/>"\']+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')
CANON = re.compile(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="canonical"')
ITCHPATH = re.compile(r'<meta content="([^"]+)" name="itch:path"|<meta name="itch:path" content="([^"]+)"')
OGSITE = re.compile(r'<meta content="itch\.io" property="og:site_name"|<meta property="og:site_name" content="itch\.io"')
OGTITLE = re.compile(r'<meta content="([^"]*)" property="og:title"|<meta property="og:title" content="([^"]*)"')
SKIP_DIRS = {"venv", "chrome-profile", "node_modules", "src"}
CSS27 = """margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right
padding-bottom padding-left font-size text-align color background-color background background-image
opacity border border-width border-color border-style width height min-width max-width min-height
max-height""".split()
ADDED = {"details", "summary", "figure", "figcaption", "del", "ruby", "rt", "rp", "font"}
ITCH_TOKENS = {"embed_preload", "youtube_preload", "other_embed", "embed_url", "toggle_post_body",
               "language-css", "spoiler"}


def kind_of(tokens):
    t = set(tokens)
    for name, need in KINDS:
        if need <= t:
            if name == "comment" and "object_text_widget_widget" in t:
                continue
            return name
    return None


def containers(doc):
    for m in OPEN.finditer(doc):
        k = kind_of(m.group(2).split())
        if not k:
            continue
        depth, tagre = 1, re.compile(r'<(/?)%s\b[^>]*>' % m.group(1), re.I)
        for d in tagre.finditer(doc, m.end()):
            depth += -1 if d.group(1) else 1
            if depth == 0:
                yield k, doc[m.end():d.start()]
                break


def iter_files(args):
    for a in args:
        if os.path.isfile(a):
            yield a
            continue
        for root, dirs, names in os.walk(a):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for n in names:
                if n.endswith((".html", ".htm")):
                    yield os.path.join(root, n)


def attrs_of(s):
    out = []
    for m in ATTR.finditer(s):
        v = m.group(2)
        if v and v[0] in "\"'":
            v = v[1:-1]
        out.append((m.group(1).lower(), v))
    return out


def classify(tok):
    if tok in ITCH_TOKENS:
        return "itch-generated"
    if tok in ("text-center", "text-justify", "text-right", "text-left"):
        return "editor-align"
    if tok.startswith("custom-"):
        return "custom-"
    if tok.startswith("custom_"):
        return "custom_"
    if tok.startswith("custom"):
        return "customX"
    if tok.lower().startswith("custom"):
        return "Custom-case"
    return "other"


def main():
    argv = sys.argv[1:]
    ctx = None
    if argv[:1] == ["--contexts"]:
        ctx = open(argv[1], "w", encoding="utf-8")
        argv = argv[2:]
    seen, files, kinds = set(), 0, Counter()
    pages = defaultdict(set)
    skipped, src_files = [], set()
    R = defaultdict(lambda: defaultdict(Counter))  # section -> kind -> key -> n

    cur = [""]

    def note(section, kind, key, n=1, snippet=None):
        R[section][kind][key] += n
        if ctx and snippet is not None:
            ctx.write(f"[{section}/{kind}/{key}] {cur[0]} :: {snippet[:240]!r}\n")

    for f in iter_files(argv):
        try:
            doc = open(f, "rb").read().decode("utf-8", "replace")
        except OSError:
            continue
        if "user_formatted" not in doc and "user_profile" not in doc:
            continue
        m = CANON.search(doc)
        page = (m.group(1) or m.group(2)) if m else None
        ip = ITCHPATH.search(doc)
        # only real itch pages: an itch.io canonical URL or itch's own itch:path meta
        if page and not re.match(r'https?://([a-z0-9-]+\.)?itch\.io(/|$)', page):
            page = None
        og = OGSITE.search(doc)
        if not page and not ip and not og:
            skipped.append(f)
            continue
        if not page and ip:
            page = "itch:path=" + (ip.group(1) or ip.group(2))
        if not page:
            t = OGTITLE.search(doc)
            page = "og:title=" + ((t.group(1) or t.group(2)) if t else os.path.basename(f))
        src_files.add(f)
        files += 1
        cur[0] = page
        for k, body in containers(doc):
            norm = TAG.sub(lambda t: "<%s%s %s>" % (t.group(1), t.group(2).lower(),
                                                    " ".join(sorted(t.group(3).split()))), body)
            key = (k, page, hashlib.sha1(norm.encode("utf-8")).hexdigest())
            if key in seen:
                continue
            seen.add(key)
            kinds[k] += 1
            pages[k].add(page)
            # ---- spans
            for sm in re.finditer(r'<span\b([^>]*)>((?:\s|&nbsp;)*)</span>', body):
                a = attrs_of(sm.group(1))
                names = ",".join(sorted(n for n, _ in a)) or "(none)"
                cls = dict(a).get("class", "") or ""
                shape = "class=custom*" if cls.startswith("custom") else ("class=other" if "class" in dict(a) else names)
                note("spans", k, f"empty span [{shape}]{' +ws' if sm.group(2) else ''}", snippet=body[max(0, sm.start()-60):sm.end()+60])
            note("spans", k, "bare non-empty <span>", len(re.findall(r'<span>(?!\s*</span>)', body)))
            note("spans", k, "any <span", len(re.findall(r'<span\b', body)))
            for hm in re.finditer(r'<(h[1-6])\b([^>]*)>(.*?)</\1>', body, re.S):
                n_sp = len(re.findall(r'<span\b', hm.group(3)))
                if n_sp >= 2:
                    note("spans", k, f"heading with >=2 spans", snippet=hm.group(0)[:200])
                if re.search(r'<span\b[^>]*>(?:\s|&nbsp;)*</span>', hm.group(3)):
                    note("spans", k, "heading containing an empty span", snippet=hm.group(0)[:200])
            for t in ("strong", "em", "b", "i", "u", "s", "a", "mark", "small", "code", "sup", "sub"):
                n = len(re.findall(r'<%s\b[^>]*>(?:\s|&nbsp;)*</%s>' % (t, t), body))
                if n:
                    note("empty-inline", k, t, n)
            for t in ("p", "div", "li", "td", "h1", "h2", "h3"):
                n = len(re.findall(r'<%s\b[^>]*>\s*</%s>' % (t, t), body))
                if n:
                    note("empty-block", k, t, n)
            # ---- tags: classes, attrs, style, iframes, added
            for t in TAG.finditer(body):
                if t.group(1):
                    continue
                tag, raw = t.group(2).lower(), t.group(3)
                a = attrs_of(raw)
                ad = dict(a)
                itch_own = (tag == "button" and "embed_preload" in raw) or 'class="embed_url"' in raw
                if tag == "button" and "data-embed_code" in ad:
                    code = htmlmod.unescape(ad.get("data-embed_code") or "")
                    for im in re.finditer(r'<iframe\b([^>]*)>', code, re.I):
                        for n, _ in attrs_of(im.group(1)):
                            note("iframes", k, f"placeholder-stored iframe @{n}")
                        note("iframes", k, "placeholder-stored iframe", snippet=im.group(0))
                if itch_own:
                    continue
                for n, v in a:
                    if n.startswith("aria-") or n in ("role", "id", "tabindex", "popover", "popovertarget",
                                                      "popovertargetaction", "hidden", "inert", "draggable",
                                                      "contenteditable", "accesskey", "translate", "spellcheck") \
                            or n.startswith("data-") or n.startswith("on"):
                        note("attrs", k, f"{tag}@{n}", snippet=t.group(0))
                if "class" in ad:
                    v = ad["class"] or ""
                    if v.strip() == "":
                        note("classes", k, "empty class attr", snippet=t.group(0))
                    for tok in v.split():
                        note("classes", k, "kind:" + classify(tok))
                        if classify(tok) in ("other", "Custom-case"):
                            note("classes", k, "OTHER-token", snippet=f"{tag}.{tok}")
                        if tok != tok.lower():
                            note("classes", k, "uppercase-token", snippet=f"{tag}.{tok}")
                        if re.search(r'[^a-z0-9_-]', tok.lower()):
                            note("classes", k, "token-with-char-outside-[a-z0-9_-]", snippet=f"{tag}.{tok}")
                        if tok.startswith("-"):
                            note("classes", k, "token-starting-with-dash", snippet=f"{tag}.{tok}")
                if "style" in ad:
                    v = ad["style"] or ""
                    for decl in v.split(";"):
                        if ":" in decl:
                            p = decl.split(":", 1)[0].strip().lower()
                            note("style", k, p if p in CSS27 else "OUTSIDE:" + p,
                                 snippet=(f"{tag} style={v}" if p not in CSS27 else None))
                if tag == "iframe":
                    note("iframes", k, "live iframe")
                    for n, _ in a:
                        note("iframes", k, f"live iframe @{n}")
                if tag in ADDED and a:
                    note("added", k, f"{tag} with attrs " + ",".join(sorted(n for n, _ in a)), snippet=t.group(0))
                if tag in ADDED:
                    note("added", k, f"{tag} total")
    out = {"files_with_containers": files, "containers": dict(kinds),
           "unique_pages": {k: len(v) for k, v in pages.items()},
           "skipped_non_itch_files_with_container_markers": len(skipped)}
    for sec, per in R.items():
        out[sec] = {k: dict(sorted(v.items())) for k, v in per.items()}
    if ctx:
        ctx.close()
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
