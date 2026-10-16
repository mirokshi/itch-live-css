"""Gap-fill (section 05, round 2): library-model probes + live fixed-point tests. No network.

Usage (needs lupa; the sanitizer venv has lupa 2.8):
  python -I g05r2probe.py <web_sanitize_repo> <LuLPeg_dir> <out.json> [corpus dirs ...]

Part A - library model. web_sanitize (leafo, @1ca8317) with an "itch model" whitelist built
from what is observed live:
  * default whitelist clone; global `style` = css.sanitize_style
  * global `class` = an itch-style token filter. The real filter is unknown, so two
    hypotheses are run side by side:
      H1 prefix   : keep a token if it starts with "custom" (case-sensitive) or is one of
                    text-center/text-justify/text-right/spoiler
      H2 strict   : same, but the token must match ^custom[A-Za-z0-9_-]*$
    Both join kept tokens with one space and drop the attribute when nothing is kept.
  * a[target]; host-based rel/referrerpolicy injection; img loading=lazy
  * tags itch adds (details summary figure figcaption del ruby rt rp font) assigned as
    `true` AFTER clone(), exactly like leafo's streak.club does for `del`
    (helpers/html.moon @b5b4679) -> the library then drops every attribute on them
  * iframe as an attribute table AFTER clone() (streak.club's list + style), so global
    attributes (title, lang, dir, class) do not apply to it
Part B - fixed-point tests over the live corpus (no content printed):
  * every authored inline style value -> css.sanitize_style(value); a stored value that the
    library would change means itch's CSS whitelist differs from the default
  * every class token -> does it satisfy H1 / H2?
  * class attribute values with leading/trailing/double whitespace (re-serialisation fingerprint)
"""
import json
import os
import re
import sys

from lupa import LuaRuntime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import g05r2scan as scan  # noqa: E402

ws_dir, lulpeg_dir, out_path = sys.argv[1:4]
corpus = sys.argv[4:]
lua = LuaRuntime(unpack_returned_tuples=True)
p = lambda d: d.replace(os.sep, "/")  # noqa: E731
lua.execute(f"""
package.path = {json.dumps(p(ws_dir) + '/?.lua;' + p(ws_dir) + '/?/init.lua;' + p(lulpeg_dir) + '/?.lua;')} .. package.path
package.loaded["lpeg"] = require("lulpeg")
""")
css = lua.eval('require("web_sanitize.css")')
if isinstance(css, tuple):  # Lua 5.4+ require() also returns the loader data
    css = css[0]

MAKE = """
local mode = ...
local wl = require("web_sanitize.whitelist"):clone()
local css = require("web_sanitize.css")
local keep_exact = { ["text-center"]=true, ["text-justify"]=true, ["text-right"]=true, ["spoiler"]=true }
wl.tags[1].style = function(v) return css.sanitize_style(v) end
wl.tags[1].class = function(v)
  if not v then return nil end  -- bare `class` attribute (no value)
  local kept = {}
  for tok in v:gmatch("%S+") do
    local ok = keep_exact[tok]
    if not ok then
      if mode == "H1" then ok = tok:match("^custom") ~= nil
      else ok = tok:match("^custom[%w_%-]*$") ~= nil end
    end
    if ok then kept[#kept+1] = tok end
  end
  if #kept == 0 then return nil end
  return table.concat(kept, " ")
end
wl.tags.a.target = true
wl.add_attributes.a = {
  rel = function(attrs)
    local h = attrs.href
    if not h then return nil end
    if h:match("^https?://[%w%-%.]*itch%.io/") or h:match("^https?://[%w%-%.]*itch%.io$") then return nil end
    return "nofollow noopener"
  end,
  referrerpolicy = function(attrs)
    local h = attrs.href
    if not h then return nil end
    if h:match("^https?://[%w%-%.]*itch%.io/") or h:match("^https?://[%w%-%.]*itch%.io$") then return nil end
    return "origin"
  end,
}
wl.add_attributes.img = { loading = "lazy" }
for _, t in ipairs({"details","summary","figure","figcaption","del","ruby","rt","rp","font"}) do
  wl.tags[t] = true
end
local url_value = function(v) return v and (v:match("^https?://") or v:match("^//")) and true end
wl.tags.iframe = { width=true, height=true, frameborder=true, allowfullscreen=true, scrolling=true,
                   src=url_value, style=function(v) return css.sanitize_style(v) end }
return require("web_sanitize.html").Sanitizer({ whitelist = wl })
"""
san = {m: lua.execute(MAKE, m) for m in ("H1", "H2")}
san = {m: (v[0] if isinstance(v, tuple) else v) for m, v in san.items()}


def run(fn, s):
    try:
        r = fn(s)
        if isinstance(r, tuple):
            r = r[0]
        return r
    except Exception as e:  # noqa: BLE001
        return "ERROR: " + str(e)[:160]


HTML = {
    # gap 1: letter-split heading
    "h1-letter-split": '<h1 class="custom-title"><span class="custom-sr">Miro</span><span class="custom-l"></span><span class="custom-l"></span></h1>',
    "empty-span-custom": '<span class="custom-l"></span>',
    "empty-span-bare": '<span></span>',
    "span-nbsp": '<span class="custom-l">&nbsp;</span>',
    # gap 2: class filter
    "class-Custom-x": '<span class="Custom-x">a</span>',
    "class-CUSTOM-x": '<span class="CUSTOM-x">a</span>',
    "class-custom-Ab_C": '<span class="custom-Ab_C">a</span>',
    "class-empty": '<span class="">a</span>',
    "class-space": '<span class=" ">a</span>',
    "class-bare-attr": '<span class>a</span>',
    "class-colon": '<span class="custom-md:flex">a</span>',
    "class-slash": '<span class="custom-w-1/2">a</span>',
    "class-brackets": '<span class="custom-[x]">a</span>',
    "class-dot": '<span class="custom-a.b">a</span>',
    "class-leading-dash": '<span class="-custom-x">a</span>',
    "class-prefix-variant": '<span class="md:custom-x">a</span>',
    "class-bem": '<span class="custom-card__title--big">a</span>',
    "class-customx": '<span class="customx custom_y">a</span>',
    "class-mixed": '<span class="foo custom-x  bar text-center">a</span>',
    "class-uppercase-attr-name": '<span CLASS="custom-x">a</span>',
    # gap 2: itch-added tags
    "details-attrs": '<details class="custom-d" style="color: red" title="t" open><summary class="custom-s">s</summary>t</details>',
    "figure-attrs": '<figure class="custom-f" style="margin: 0"><img src="https://x.example/a.png" alt="a"><figcaption class="custom-c">c</figcaption></figure>',
    # gap 2: popover / aria / inline custom properties
    "popover": '<div class="custom-p" popover id="p">x</div><a popovertarget="p" class="custom-b">t</a><span popover="auto">y</span>',
    "aria-role": '<span class="custom-x" aria-label="x" aria-hidden="true" role="img" tabindex="0" id="k" data-x="1">x</span>',
    "style-var-nospace": '<span style="--i:3">a</span>',
    "style-var-space": '<span style="--i: 3">a</span>',
    "style-var-then-color": '<span style="--i:3;color:red">a</span>',
    "style-color-then-var": '<span style="color: red; --i: 3">a</span>',
    # gap 2: iframe attributes
    "iframe-youtube-default": '<iframe width="560" height="315" src="https://www.youtube.com/embed/x" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen class="custom-v" style="width: 100%" loading="lazy" sandbox="allow-scripts"></iframe>',
}

STYLE27 = {
    "margin": "0 auto", "margin-top": "4px", "margin-right": "4px", "margin-bottom": "4px", "margin-left": "4px",
    "padding": "4px 8px", "padding-top": "4px", "padding-right": "4px", "padding-bottom": "4px", "padding-left": "4px",
    "font-size": "120%", "text-align": "center", "color": "#ffc857", "background-color": "#0b1433",
    "background": "#0b1433", "background-image": "url('https://x.example/a.png')", "opacity": ".5",
    "border": "1px solid #ccc", "border-width": "2px", "border-color": "#ccc", "border-style": "dashed",
    "width": "100%", "height": "40px", "min-width": "40px", "max-width": "320px", "min-height": "40px",
    "max-height": "320px",
}
NEGATIVE = {"border-radius": "4px", "display": "block", "font-weight": "700", "line-height": "2",
            "transform": "rotate(5deg)", "position": "relative", "font-family": "serif"}

res = {"html": {}, "style27": {}, "negative": {}, "fixed_point": {}, "class_tokens": {}}
for name, h in HTML.items():
    res["html"][name] = {"in": h, "H1": run(san["H1"], h), "H2": run(san["H2"], h)}
for prop, val in STYLE27.items():
    res["style27"][prop] = run(css.sanitize_style, f"{prop}: {val}")
for prop, val in NEGATIVE.items():
    res["negative"][prop] = run(css.sanitize_style, f"{prop}: {val}")

# ---- Part B: fixed point over live corpus
if corpus:
    from collections import Counter
    fp = Counter()
    changed_props = Counter()
    toks = Counter()
    ws = Counter()
    seen = set()
    seen_c = set()  # containers deduplicated by (kind, attribute-order-normalised body)
    for f in scan.iter_files(corpus):
        doc = open(f, "rb").read().decode("utf-8", "replace")
        if not (scan.ITCHPATH.search(doc) or scan.OGSITE.search(doc) or scan.CANON.search(doc)):
            continue
        for k, body in scan.containers(doc):
            norm = scan.TAG.sub(lambda t: "<%s%s %s>" % (t.group(1), t.group(2).lower(),
                                                         " ".join(sorted(t.group(3).split()))), body)
            ckey = (k, hash(norm))
            if ckey in seen_c:
                continue
            seen_c.add(ckey)
            for t in scan.TAG.finditer(body):
                if t.group(1):
                    continue
                raw = t.group(3)
                if (t.group(2).lower() == "button" and "embed_preload" in raw) or 'class="embed_url"' in raw:
                    continue
                for n, v in scan.attrs_of(raw):
                    if n == "style" and v is not None:
                        key = (k, v)
                        if key in seen:
                            continue
                        seen.add(key)
                        out = run(css.sanitize_style, v)
                        if out == v:
                            fp[f"{k}:unchanged"] += 1
                        else:
                            fp[f"{k}:CHANGED"] += 1
                            for d in v.split(";"):
                                if ":" in d:
                                    pr = d.split(":", 1)[0].strip().lower()
                                    if f"{pr}:" not in (out or "").replace(" ", ""):
                                        changed_props[pr] += 1
                    if n == "class" and v is not None:
                        if v != v.strip() or "  " in v or re.search(r"[\t\r\n]", v):
                            ws[f"{k}:irregular-whitespace"] += 1
                        else:
                            ws[f"{k}:normalised"] += 1
                        for tok in v.split():
                            if tok in ("text-center", "text-justify", "text-right", "spoiler") or tok in scan.ITCH_TOKENS:
                                continue
                            h1 = tok.startswith("custom")
                            h2 = re.fullmatch(r"custom[A-Za-z0-9_-]*", tok) is not None
                            toks[f"{k}:H1={'y' if h1 else 'n'},H2={'y' if h2 else 'n'}"] += 1
    res["fixed_point"] = {"style_values": dict(fp), "props_altered_by_library": dict(changed_props)}
    res["class_tokens"] = {"hypothesis_fit": dict(toks), "class_value_whitespace": dict(ws)}

with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(res, fh, ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in res.items() if k in ("fixed_point", "class_tokens")}, indent=1))
