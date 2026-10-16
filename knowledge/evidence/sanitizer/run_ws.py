"""Run leafo/web_sanitize (compiled .lua files from the cloned repo) under lupa/LuaJIT
with LuLPeg (pure-Lua LPeg 0.12 port) standing in for the C LPeg module.

Usage: venv/Scripts/python.exe -I run_ws.py <web_sanitize_dir> <lulpeg_dir> <cases.lua> <out.json>

cases.lua must `return` a table: { {group=..., fn="html"|"html_itchlike"|"style"|"text", input=..., expect=...(optional)}, ... }
"""
import json
import sys

from lupa import luajit21

ws_dir, lulpeg_dir, cases_file, out_file = sys.argv[1:5]

L = luajit21.LuaRuntime(unpack_returned_tuples=True)
setup = r"""
local ws_dir, lulpeg_dir = ...
package.path = ws_dir .. "/?.lua;" .. ws_dir .. "/?/init.lua;" .. lulpeg_dir .. "/?.lua;" .. package.path
package.preload["lpeg"] = function() return require("lulpeg") end
local web_sanitize = require("web_sanitize")
local Sanitizer = require("web_sanitize.html").Sanitizer

-- An itch-LIKE whitelist reconstructed from live observations (NOT itch's real config):
-- class filtered to custom*/editor classes, style via sanitize_style, iframe, details/summary,
-- figure/figcaption, del, ruby/rt/rp, a[target], dynamic rel for non-itch links.
local wl = require("web_sanitize.whitelist"):clone()
local function class_filter(value)
  local keep = {}
  for token in value:gmatch("%S+") do
    if token:match("^custom") or token == "text-center" or token == "text-right" or token == "text-justify" then
      table.insert(keep, token)
    end
  end
  if #keep == 0 then return false end
  return table.concat(keep, " ")
end
wl.tags[1].class = class_filter
wl.tags[1].style = function(v) return web_sanitize.sanitize_style(v) end
local url_value = function(v) return v and (v:match("^https?://") or v:match("^//")) and true end
wl.tags.iframe = { src = url_value, width = true, height = true, frameborder = true, allowfullscreen = true, scrolling = true }
wl.tags.details = true; wl.tags.summary = true; wl.tags.figure = true; wl.tags.figcaption = true
wl.tags.del = true; wl.tags.ruby = true; wl.tags.rt = true; wl.tags.rp = true
wl.tags.a.target = true
wl.add_attributes.a = {
  rel = function(attr)
    local href = attr.href or ""
    if not href:match("^https?://[%w%-%.]*itch%.io") then return "nofollow noopener" end
  end
}
local itchlike = Sanitizer({ whitelist = wl })

return function(fn, input)
  local ok, res, err
  if fn == "html" then
    ok, res = pcall(web_sanitize.sanitize_html, input)
  elseif fn == "html_strip" then
    ok, res = pcall(Sanitizer({ strip_tags = true }), input)
  elseif fn == "html_itchlike" then
    ok, res = pcall(itchlike, input)
  elseif fn == "style" then
    ok, res, err = pcall(web_sanitize.sanitize_style, input)
    if ok and res == nil then res = "<nil: " .. tostring(err) .. ">" end
  elseif fn == "text" then
    ok, res = pcall(web_sanitize.extract_text, input)
  end
  if not ok then return "<error: " .. tostring(res) .. ">" end
  return res
end
"""
runner = L.execute(setup, ws_dir, lulpeg_dir)
cases = L.execute(open(cases_file, encoding="utf-8").read())
results = []
passed = failed = 0
for i in range(1, len(cases) + 1):
    c = cases[i]
    out = runner(c["fn"], c["input"])
    row = {"group": c["group"], "fn": c["fn"], "input": c["input"], "output": out}
    if c["expect"] is not None:
        row["expect"] = c["expect"]
        row["pass"] = out == c["expect"]
        passed += row["pass"]
        failed += not row["pass"]
    results.append(row)
with open(out_file, "w", encoding="utf-8") as fh:
    json.dump(results, fh, indent=1, ensure_ascii=False)
for r in results:
    flag = "" if "pass" not in r else ("PASS " if r["pass"] else "FAIL ")
    print(f"[{r['group']}] {flag}{r['fn']}: {r['input']!r}\n    -> {r['output']!r}" + ("" if r.get("pass", True) else f"\n    expected {r['expect']!r}"))
print(f"spec vectors: {passed} passed, {failed} failed")
