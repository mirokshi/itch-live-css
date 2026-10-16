# Approximate ABP/uBO network-filter matcher (subset) to see which rules of Brave's default lists
# could hit an itch-imported stylesheet. Usage: python -I match_lists.py <lists_dir>
# Supports: @@ exceptions, ||host^ anchors, | anchors, * and ^ wildcards, /regex/,
# options third-party/3p/~third-party/1p, stylesheet/css, font, image, other types, domain=/from=, important,
# and hosts-style lines ("0.0.0.0 host" / "||host^"). Cosmetic (##, #@#, #?#, ##+js) lines are skipped.
import os, re, sys

D = sys.argv[1]
TYPES = {"stylesheet": "stylesheet", "css": "stylesheet", "font": "font", "image": "image", "script": "script",
         "xmlhttprequest": "xhr", "xhr": "xhr", "subdocument": "sub", "frame": "sub", "media": "media",
         "ping": "ping", "websocket": "ws", "other": "other", "document": "doc", "doc": "doc", "popup": "popup"}

def compile_pattern(p):
    if len(p) > 2 and p.startswith("/") and p.endswith("/"):
        try:
            return re.compile(p[1:-1], re.I)
        except re.error:
            return None
    rx = ""
    if p.startswith("||"):
        rx = r"^[a-z]+://([^/]*\.)?"; p = p[2:]
    elif p.startswith("|"):
        rx = "^"; p = p[1:]
    end = ""
    if p.endswith("|"):
        end = "$"; p = p[:-1]
    for ch in p:
        if ch == "*": rx += ".*"
        elif ch == "^": rx += r"([^\w\-.%]|$)"
        else: rx += re.escape(ch)
    try:
        return re.compile(rx + end, re.I)
    except re.error:
        return None

def parse(line):
    line = line.strip()
    if not line or line.startswith("!") or line.startswith("[") or "##" in line or "#@#" in line or "#?#" in line or "#$#" in line:
        return None
    m = re.match(r"^(0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)", line)
    if m:
        return {"raw": line, "exc": False, "rx": compile_pattern("||" + m.group(2) + "^"), "opts": {}}
    exc = line.startswith("@@")
    if exc: line = line[2:]
    opts = {}
    if "$" in line and not (line.startswith("/") and line.rstrip("$").endswith("/")):
        idx = line.rfind("$")
        pat, optstr = line[:idx], line[idx + 1:]
        if re.match(r"^[\w\-~=,|.*:/@ ]*$", optstr):
            for o in optstr.split(","):
                k, _, v = o.partition("=")
                opts[k.strip()] = v
        else:
            pat = line
    else:
        pat = line
    if pat in ("", "*"):
        pat = "*"
    rx = compile_pattern(pat)
    return {"raw": line if not exc else "@@" + line, "exc": exc, "rx": rx, "opts": opts}

def opts_ok(o, rtype, third, src):
    types_on = [TYPES[k] for k in o if k in TYPES]
    types_off = [TYPES[k[1:]] for k in o if k.startswith("~") and k[1:] in TYPES]
    if types_on and rtype not in types_on: return False
    if rtype in types_off: return False
    if ("third-party" in o or "3p" in o) and not third: return False
    if ("~third-party" in o or "1p" in o or "first-party" in o) and third: return False
    dom = o.get("domain") or o.get("from")
    if dom:
        inc = [d for d in dom.split("|") if not d.startswith("~")]
        exc = [d[1:] for d in dom.split("|") if d.startswith("~")]
        hit = lambda d: src == d or src.endswith("." + d) or (d.endswith(".*") and src.split(".")[0] == d[:-2])
        if any(hit(d) for d in exc): return False
        if inc and not any(hit(d) for d in inc): return False
    for k in ("removeparam", "redirect-rule", "csp", "permissions", "header", "replace", "urlskip", "uritransform", "urltransform"):
        if k in o: return False  # modifier-only filters, they don't block
    return True

rules = []
for fn in sorted(os.listdir(D)):
    if not fn.endswith(".txt") or fn.startswith("urls"): continue
    with open(os.path.join(D, fn), encoding="utf-8", errors="replace") as f:
        for line in f:
            r = parse(line)
            if r and r["rx"] is not None:
                r["list"] = fn; rules.append(r)
print("network rules parsed:", len(rules))

import os as _os
EXTRA = _os.environ.get("EXTRA_PATHS")
tests = [(f"https://css.example.com{x}", "stylesheet", "mirokshi.itch.io") for x in EXTRA.split(",")] if EXTRA else []
tests += [
    ("https://itch-io-custom-css-custom-css.vercel.app/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://itch-io-custom-css-custom-css.vercel.app/title.css", "stylesheet", "mirokshi.itch.io"),
    ("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap", "stylesheet", "mirokshi.itch.io"),
    ("https://fonts.gstatic.com/s/syne/v24/8vIH7w4qzmVxm2BL9A.woff2", "font", "mirokshi.itch.io"),
    ("https://my-itch-css.pages.dev/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://my-itch-css.example.workers.dev/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://my-itch-css.netlify.app/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://someuser.github.io/itch-css/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://cdn.jsdelivr.net/gh/someuser/itch-css@main/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://my-itch-css.deno.dev/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://css.example.com/live.css", "stylesheet", "mirokshi.itch.io"),
    ("https://css.example.com/track.css", "stylesheet", "mirokshi.itch.io"),
    ("https://css.example.com/pixel.gif?u=1", "image", "mirokshi.itch.io"),
    ("https://css.example.com/analytics/hit.png", "image", "mirokshi.itch.io"),
    ("https://css.example.com/counter.svg", "image", "mirokshi.itch.io"),
    ("https://visitor-badge.laobi.icu/badge?page_id=x", "image", "mirokshi.itch.io"),
    ("https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=x", "image", "mirokshi.itch.io"),
    ("https://img.itch.zone/aW1nLzMwODAyMjIyLmpwZw==/original/2dSiyI.jpg", "image", "mirokshi.itch.io"),
]
for url, rtype, src in tests:
    host = re.match(r"^[a-z]+://([^/]+)", url).group(1)
    third = not (host == src or host.endswith(".itch.io") or host.endswith("itch.zone") and False)
    if host.endswith("itch.zone"): third = True
    blocks = [r for r in rules if not r["exc"] and r["rx"].search(url) and opts_ok(r["opts"], rtype, third, src)]
    excs = [r for r in rules if r["exc"] and r["rx"].search(url) and opts_ok(r["opts"], rtype, third, src)]
    verdict = "BLOCK?" if blocks and not excs else ("allowed by exception" if blocks else "no match")
    print(f"\n[{verdict}] {rtype:10} {url}")
    for r in blocks[:8]: print("   block:", r["list"], "|", r["raw"][:110])
    for r in excs[:5]: print("   allow:", r["list"], "|", r["raw"][:110])

# Hosts mentioned anywhere (incl. cosmetic) for the platform domains
print("\n--- raw mentions of platform suffixes (all lines, any type) ---")
for suf in ["vercel.app", "workers.dev", "pages.dev", "netlify.app", "github.io", "deno.dev", "jsdelivr", "fonts.googleapis", "fonts.gstatic"]:
    n = 0; ex = []
    for fn in sorted(os.listdir(D)):
        if not fn.endswith(".txt") or fn.startswith("urls"): continue
        for line in open(os.path.join(D, fn), encoding="utf-8", errors="replace"):
            if suf in line and not line.startswith("!"):
                n += 1
                if len(ex) < 4: ex.append(fn + " | " + line.strip()[:100])
    print(f"{suf}: {n} lines"); [print("    ", e) for e in ex]
