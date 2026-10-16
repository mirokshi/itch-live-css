"""Second-pass verifier probe for web_sanitize (independent harness).
usage: python -I probe2.py <web_sanitize_dir> <LuLPeg_dir> <out.json>
Runs (a) spec sanity vectors, (b) HTML probes on the default whitelist,
(c) HTML probes on an itch-like whitelist (default + global style=sanitize_style
    + a[target] + host-based rel/referrerpolicy injection + img loading=lazy),
(d) sanitize_style probes.
"""
import sys, json, os
import os
if os.environ.get("LUPA_JIT"):
    from lupa.luajit21 import LuaRuntime
else:
    from lupa import LuaRuntime

ws_dir, lulpeg_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
lua = LuaRuntime(unpack_returned_tuples=True)
lua.execute(f"""
package.path = {json.dumps(ws_dir.replace(os.sep, '/') + '/?.lua;' + ws_dir.replace(os.sep, '/') + '/?/init.lua;' + lulpeg_dir.replace(os.sep, '/') + '/?.lua;')} .. package.path
package.loaded["lpeg"] = require("lulpeg")
""")
ws = lua.eval('require("web_sanitize")')
html = lua.eval('require("web_sanitize.html")')
css = lua.eval('require("web_sanitize.css")')
default = html.Sanitizer()
itchlike = lua.execute("""
local wl = require("web_sanitize.whitelist"):clone()
local css = require("web_sanitize.css")
wl.tags[1].style = function(v) return css.sanitize_style(v) end
wl.tags.a.target = true
wl.add_attributes.a = {
  rel = function(attrs)
    local h = attrs.href or ""
    if not (h:match("^https?://[%w%-%.]*itch%.io/") or h:match("^https?://[%w%-%.]*itch%.io$")) then return "nofollow noopener" end
  end,
}
wl.add_attributes.img = { loading = "lazy" }
return require("web_sanitize.html").Sanitizer({whitelist = wl})
""")

def run(fn, s):
    try:
        r = fn(s)
        if isinstance(r, tuple):
            return {"out": r[0], "err": r[1] if len(r) > 1 else None}
        return {"out": r}
    except Exception as e:  # noqa
        return {"error": str(e)[:200]}

spec = [
    ("<div>hello</div>", "<div>hello</div>"),
    ("<span/>x", "&lt;span/&gt;x"),
    ("<b>x</i></b></b>", "<b>x&lt;/i&gt;</b>&lt;/b&gt;"),
    ("<div><span>open", "<div><span>open</span></div>"),
    ("<a href=\"http://leafo.net\" onclick=\"x\">a</a>", "<a href=\"http://leafo.net\" rel=\"nofollow\">a</a>"),
    ("it's \"q\"", "it&#x27;s &quot;q&quot;"),
    ("<br/>", "<br/>"),
]
html_cases = [
    '<div class="custom-x">a</div>', '<div id="x" data-y="1" tabindex="0" onclick="alert(1)" role="note" aria-hidden="true">a</div>',
    '<a href="#top">t</a>', '<a href="/rel">t</a>', '<a href="HTTPS://x.com">t</a>', '<a href="tel:123">t</a>',
    '<a href="javascript:alert(1)">t</a>', '<a href=" https://x.com">t</a>', '<a href="mailto:a@b.c">t</a>', '<a href="//x.com">t</a>',
    '<a rel="me" href="https://m.social/@x">m</a>', '<a name="sec"></a>', '<a href="https://x.com" target="_blank">t</a>',
    '<img src="https://x.com/a.png" width=100%>', '<img src="https://x.com/a.png" width=100>', '<a href=https://x.com>t</a>',
    '<div @click="x">a</div>', '<div x-on:click="x">a</div>', '<div\r\n title="x">a</div>', '<div\n title="x">a</div>',
    '<span/>after', '<div/>after', '<br/>a', '<hr/>a', '<img src="https://x.com/a.png"/>a',
    'a<wbr>b', '<marquee>x</marquee>', '<svg><circle r="1"/></svg>', '<details open><summary>s</summary>t</details>',
    'a<!-- note -->b', 'a < b and c > d', 'x < div > y', 'R&D and a & b &amp; &nbsp &#39 &#x27;',
    '<img src="data:image/png;base64,AAA">', '<img src="/rel.png">', '<a href="https://x.com/?a=1&b=2">q</a>',
    '<table width="100" border="1" cellpadding="2" align="center"><tr><td width="5" colspan="2" rowspan="1" align="left">x</td></tr></table>',
    '<span lang="es" dir="rtl" title="t">x</span>', '<b>b</b><i>i</i><strike>s</strike>', '<font color="red">x</font>',
    '<p title="it\'s">x</p>', "<p title='a\"b'>x</p>", '<p title="a<b>">x</p>',
]
style_cases = [
    'color:red', 'color: red', 'color: red ', 'color: red; ', 'color:red;', 'color:red;;', 'color: red !important',
    'display:flex;color:red', 'font-size: 1.5em', 'font-size: 150%', 'font-size: large', 'font-size: -10px', 'font-size: auto',
    'margin: 0.5em 1em', 'width: 10.5px', 'width: calc(100% - 10px)', 'width: -10px', 'width: auto', 'height:auto', 'padding:auto',
    'margin-top: -10px', 'color: var(--itchio_link_color)', 'color: hsl(120deg, 50%, 50%)', 'color: rgb(1 2 3 / 50%)',
    'color: rgba(0,0,0,.5)', 'color:#11223344', "background: url('https://x.com/a.png')", "background: url('https://x.com/a.png') no-repeat",
    'background: url(https://x.com/a.png)', 'background: url(x)', 'background: linear-gradient(red, blue)', 'border: none',
    'border: 2px dashed', 'border:0', 'border:1px solid #ccc', 'border: 2px dashed rgb(1,2,3)', 'COLOR: red', 'color: red /* c */',
    'color: red;\r\nwidth: 10px', 'color: red;\nwidth: 10px', '  color: red', 'width: 50.5%', 'opacity: .5', 'opacity: 0.5',
    'line-height:2;letter-spacing:1px;font-family:serif;font-weight:bold;border-radius:4px;position:absolute;float:left;transform:none',
    'text-align:center', 'max-width:100%', 'behavior: url(x.htc)', 'behavior:url(x)', '', '   ',
]
res = {"spec": [], "default": {}, "itchlike": {}, "style": {}}
for i, e in spec:
    o = run(default, i)
    res["spec"].append({"in": i, "expect": e, "got": o, "pass": o.get("out") == e})
for c in html_cases:
    res["default"][c] = run(default, c)
    res["itchlike"][c] = run(itchlike, c)
for c in style_cases:
    res["style"][c] = run(css.sanitize_style, c)
with open(out, "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=1)
print("spec pass:", sum(1 for x in res["spec"] if x["pass"]), "/", len(res["spec"]))
for x in res["spec"]:
    if not x["pass"]:
        print("FAIL", x)
