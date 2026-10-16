"""Section-05 extra probes against leafo/web_sanitize defaults (library model only, NOT itch).

Usage: python -I s05probe.py <web_sanitize_dir> <lulpeg_dir> <out.json>
"""
import json
import sys

from lupa import luajit21

ws_dir, lulpeg_dir, out_file = sys.argv[1:4]
L = luajit21.LuaRuntime(unpack_returned_tuples=True)
run = L.execute(r"""
local ws_dir, lulpeg_dir = ...
package.path = ws_dir .. "/?.lua;" .. ws_dir .. "/?/init.lua;" .. lulpeg_dir .. "/?.lua;" .. package.path
package.preload["lpeg"] = function() return require("lulpeg") end
local ws = require("web_sanitize")
return function(fn, input)
  local ok, res, err
  if fn == "html" then ok, res = pcall(ws.sanitize_html, input)
  else
    ok, res, err = pcall(ws.sanitize_style, input)
    if ok and res == nil then res = "<nil " .. tostring(err) .. ">" end
  end
  if not ok then return "<error " .. tostring(res) .. ">" end
  return res
end
""", ws_dir, lulpeg_dir)

CASES = [
    # spec sanity vectors (expected from the library's spec)
    ("html", "<b>x</i></b></b>", "<b>x&lt;/i&gt;</b>&lt;/b&gt;"),
    ("style", "margin-left: 50px;", "margin-left: 50px"),
    ("style", "background: url(http://example.com/image.png)", "<nil failed to parse>"),
    # custom properties / var() in inline style
    ("style", "--i: 1", None),
    ("style", "--i: 1; color: red", None),
    ("style", "color: var(--gold)", None),
    ("style", "background: var(--gold)", None),
    ("style", "background-color: var(--gold)", None),
    ("style", "color: currentColor", None),
    # integer units, keywords
    ("style", "font-size: 2em", None),
    ("style", "width: 100%", None),
    ("style", "max-width: 320px", None),
    ("style", "text-align: center", None),
    ("style", "opacity: 50%", None),
    ("style", "border: 2px solid var(--gold)", None),
    ("style", "border-style: dashed", None),
    ("style", "background-image: url('https://a.example/b.png')", None),
    ("style", "background-image: url(\"https://a.example/b.png\")", None),
    # empty hook elements and global attrs
    ("html", "<span></span><div></div><p></p>", None),
    ("html", "<p lang=\"ja\" title=\"t\">x</p><abbr title=\"HyperText\">HTML</abbr>", None),
    ("html", "<a name=\"faq\"></a>", None),
    ("html", "<img src=\"https://a.example/i.png\" alt=\"\">", None),
    ("html", "<h1><span>M</span><span>i</span></h1>", None),
]

out = []
for fn, inp, exp in CASES:
    res = run(fn, inp)
    row = {"fn": fn, "input": inp, "output": res}
    if exp is not None:
        row["pass"] = res == exp
    out.append(row)
    print(json.dumps(row, ensure_ascii=False))
json.dump(out, open(out_file, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
