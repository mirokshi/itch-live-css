"""Independent re-run of leafo/web_sanitize probes (verifier's own harness).

Usage: python -I verify_ws.py <web_sanitize_dir> <lulpeg_dir> <out.json>
Each case: (group, fn, input, expected_or_None). fn in html | itch | style
"itch" = verifier's own itch-LIKE whitelist (NOT itch's real config).
"""
import json
import sys

from lupa import luajit21

ws_dir, lulpeg_dir, out_file = sys.argv[1:4]
L = luajit21.LuaRuntime(unpack_returned_tuples=True)
runner = L.execute(r"""
local ws_dir, lulpeg_dir = ...
package.path = ws_dir .. "/?.lua;" .. ws_dir .. "/?/init.lua;" .. lulpeg_dir .. "/?.lua;" .. package.path
package.preload["lpeg"] = function() return require("lulpeg") end
local ws = require("web_sanitize")
local Sanitizer = require("web_sanitize.html").Sanitizer
local wl = require("web_sanitize.whitelist"):clone()
wl.tags[1].class = function(v)
  local keep = {}
  for t in v:gmatch("%S+") do if t:match("^custom") or t:match("^text%-") then keep[#keep+1] = t end end
  if #keep == 0 then return nil end
  return table.concat(keep, " ")
end
wl.tags[1].style = function(v) return ws.sanitize_style(v) end
wl.tags.details = true; wl.tags.summary = true
wl.tags.a.target = true
wl.add_attributes.a = { rel = function(a) if not (a.href or ""):match("^https?://[%w%.%-]*itch%.io") then return "nofollow noopener" end end }
local itch = Sanitizer({ whitelist = wl })
return function(fn, input)
  local ok, res, err
  if fn == "html" then ok, res = pcall(ws.sanitize_html, input)
  elseif fn == "itch" then ok, res = pcall(itch, input)
  elseif fn == "style" then
    ok, res, err = pcall(ws.sanitize_style, input)
    if ok and res == nil then res = "<nil " .. tostring(err) .. ">" end
  end
  if not ok then return "<error " .. tostring(res) .. ">" end
  return res
end
""", ws_dir, lulpeg_dir)

CASES = [
    # spec sanity (expected outputs from the library's own spec/README)
    ("spec", "html", "<b>x</i></b></b>", "<b>x&lt;/i&gt;</b>&lt;/b&gt;"),
    ("spec", "html", "<!-- comment -->Hello", "&lt;!-- comment --&gt;Hello"),
    ("spec", "html", "<div />", "&lt;div /&gt;"),
    ("spec", "html", "<br />", "<br />"),
    ("spec", "html", "<IMG SRC=javascript:alert('XSS')>", "&lt;IMG SRC=javascript:alert(&#x27;XSS&#x27;)&gt;"),
    ("spec", "style", "margin: 10px; fake-property: 100; margin: 10px", "margin: 10px; margin: 10px"),
    ("spec", "style", "background: url(http://example.com/image.png)", "<nil failed to parse>"),
    ("spec", "style", "margin-left: 50px;", "margin-left: 50px"),
    # attributes
    ("attr", "html", '<div class="custom-x" id="a" data-y="1" aria-hidden="true" role="note" tabindex="0" onclick="x()" hidden>t</div>', None),
    ("attr", "itch", '<span class="custom-a custom_b customc Custom-d text-center foo">x</span>', None),
    ("attr", "itch", '<details open><summary>s</summary>b</details>', None),
    ("attr", "html", '<h2 title="t" lang="es" dir="rtl" style="color:red">x</h2>', None),
    ("attr", "html", '<table border="1" cellpadding="2" align="center" width="50%"><tr><td colspan="2" rowspan="1" width="5" align="left">x</td></tr></table>', None),
    ("attr", "html", '<img src="https://a.example/i.png" alt="a" title="t" width="10" height="2" align="left" loading="eager" srcset="x 2x" class="custom-i">', None),
    # hrefs
    ("href", "itch", '<a href="#x">1</a><a href="/p">2</a><a href="tel:1">3</a><a href="javascript:x">4</a><a href="HTTPS://A.EXAMPLE">5</a><a href=" https://a.example">6</a>', None),
    ("href", "itch", '<a href="mailto:a@b.c">7</a><a href="//a.example">8</a><a href="http://a.example">9</a><a href="https://x.itch.io/g#s">10</a>', None),
    ("href", "itch", '<a href="https://mastodon.example/@a" rel="me" target="_blank">m</a><a href="https://x.itch.io" rel="author">i</a>', None),
    ("href", "itch", '<a href="https://a.example/?a=1&b=2&amp;c=3">q</a>', None),
    ("img", "html", '<img src="data:image/png;base64,AAAA" alt="d">', None),
    ("img", "html", '<img src="/rel.png" alt="r"><img src="//cdn.example/x.png">', None),
    # parse failures
    ("parse", "html", '<img src="https://a.example/c.png" width=100%>', None),
    ("parse", "html", '<a href=https://a.example>x</a>', None),
    ("parse", "html", '<img width=100 height=2.5>', None),
    ("parse", "html", '<div @click="x">a</div>', None),
    ("parse", "html", '<div x-on:click="x" v-bind:a="b">a</div>', None),
    ("parse", "html", '<div\r\n title="x">a</div>', None),
    ("parse", "html", '<div\n\ttitle="x">a</div>', None),
    ("parse", "html", '<span/>after', None),
    ("parse", "html", '<span class="x"/>after', None),
    ("parse", "html", '<img src="https://a.example/c.png"/>z<hr/><br/>', None),
    ("parse", "html", '<div><span>open', None),
    ("parse", "html", 'a < b and c > d', None),
    ("parse", "html", 'x < div > y', None),
    ("parse", "html", '1 <2 and 3> 0', None),
    ("parse", "html", 'a<!-- note -->b', None),
    ("parse", "html", '<p>A<marquee>B</marquee>C<wbr>D<svg><circle r="1"/></svg>E</p>', None),
    ("parse", "html", '<font color="red">f</font><center>c</center><video src="https://a/v.mp4"></video><section>s</section>', None),
    ("parse", "html", '<P><B>upper</B></P>', None),
    # text escaping
    ("text", "html", "it's \"q\" Tom & Jerry R&D AT&T &nbsp &copy; &#39; &#x27; 5 > 3", None),
    # styles
    ("style", "style", "color: red", None),
    ("style", "style", "color: red;", None),
    ("style", "style", "color: red; ", None),
    ("style", "style", "color: red ", None),
    ("style", "style", " color: red", None),
    ("style", "style", "color:red;width:10px", None),
    ("style", "style", "color: red;\r\nwidth: 10px", None),
    ("style", "style", "color: red;\nwidth: 10px", None),
    ("style", "style", "color: red !important", None),
    ("style", "style", "color:red;;width:10px", None),
    ("style", "style", "color:red; /* c */ width:10px", None),
    ("style", "style", "color: rgb(1 2 3 / 50%)", None),
    ("style", "style", "color: rgb(1, 2, 3)", None),
    ("style", "style", "color: rgba(0,0,0,.5)", None),
    ("style", "style", "color: var(--itchio_link_color)", None),
    ("style", "style", "color: #11223344", None),
    ("style", "style", "font-size: 1.5em", None),
    ("style", "style", "font-size: 150%", None),
    ("style", "style", "font-size: large", None),
    ("style", "style", "width: 50.5%", None),
    ("style", "style", "width: 10.5px", None),
    ("style", "style", "width: -10px", None),
    ("style", "style", "width: auto", None),
    ("style", "style", "width: calc(100% - 10px)", None),
    ("style", "style", "max-width: 100%", None),
    ("style", "style", "opacity: 0.5", None),
    ("style", "style", "opacity: .5", None),
    ("style", "style", "margin: 0.5em 1em", None),
    ("style", "style", "margin-top: -10px", None),
    ("style", "style", "margin: 0 auto", None),
    ("style", "style", "padding: auto", None),
    ("style", "style", "padding: 1.5em", None),
    ("style", "style", "background: url('https://a.example/a.png')", None),
    ("style", "style", "background: url('https://a.example/a.png') no-repeat", None),
    ("style", "style", "background: linear-gradient(red, blue)", None),
    ("style", "style", "background-image: linear-gradient(red, blue)", None),
    ("style", "style", "border: none", None),
    ("style", "style", "border: 0", None),
    ("style", "style", "border: 2px dashed", None),
    ("style", "style", "border: 1px solid #ccc", None),
    ("style", "style", "COLOR: red", None),
    ("style", "style", "display:flex;float:left;color:red", None),
    ("style", "style", "line-height: 2; letter-spacing: 1px; font-family: serif; font-weight: bold; border-radius: 4px; position: absolute; transform: rotate(1deg); text-decoration: underline", None),
    ("style", "style", "behavior:url(x)", None),
    ("style", "style", "color: red; background-color: blue", None),
    ("style", "style", "", None),
]

out = []
ok = bad = 0
for g, fn, inp, exp in CASES:
    res = runner(fn, inp)
    row = {"group": g, "fn": fn, "input": inp, "output": res}
    if exp is not None:
        row["pass"] = res == exp
        ok += row["pass"]
        bad += not row["pass"]
    out.append(row)
    print(f"[{g}/{fn}] {inp!r}\n   -> {res!r}" + ("" if exp is None else ("  PASS" if res == exp else f"  FAIL expected {exp!r}")))
print(f"spec sanity: {ok} pass, {bad} fail")
json.dump(out, open(out_file, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
