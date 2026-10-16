"""Framework class-token shapes through the web_sanitize library model (gapfill-08, 2026-10-14).
usage: <venv python> -I tokprobe.py <web_sanitize_dir> <LuLPeg_dir> <out.json>
The library's default whitelist drops `class` entirely; itch's own class-token filter is NOT in the library.
So this probe only answers: does the parser keep these attribute values intact when `class` is allowed
(class=true), and what would three candidate itch filters keep? The candidate filters are hypotheses.
"""
import sys, json, os, re
from lupa import LuaRuntime

ws_dir, lulpeg_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
lua = LuaRuntime(unpack_returned_tuples=True)
fw = lambda p: p.replace(os.sep, '/')
lua.execute(f"""
package.path = {json.dumps(fw(ws_dir) + '/?.lua;' + fw(ws_dir) + '/?/init.lua;' + fw(lulpeg_dir) + '/?.lua;')} .. package.path
package.loaded["lpeg"] = require("lulpeg")
""")
san = lua.execute("""
local wl = require("web_sanitize.whitelist"):clone()
wl.tags[1].class = true
return require("web_sanitize.html").Sanitizer({whitelist = wl})
""")
TOKENS = [
    'custom-flex', 'custom_flex', 'customflex', '-custom-mt-4', 'custom-w-1/2', 'custom-w-[37px]',
    'md:custom-flex', 'hover:custom-text-red-500', 'custom-bg-red-500/50', 'custom:flex', 'custom:md:flex',
    'custom:-mt-4', 'custom:w-[37px]', 'custom:w-1/2', '!custom-flex', 'custom-btn', 'custom-text-center',
]
FILTERS = {  # hypotheses for itch's token filter, consistent with every live observation so far
    'prefix "custom"': lambda t: t.startswith('custom'),
    'regex ^custom[%w_-]*$': lambda t: re.fullmatch(r'custom[A-Za-z0-9_-]*', t) is not None,
    'prefix "custom-" or "custom_"': lambda t: t.startswith('custom-') or t.startswith('custom_'),
}
res = {'parser': {}, 'filters': {}}
for t in TOKENS:
    html = f'<p class="{t}">x</p>'
    r = san(html)
    o = r[0] if isinstance(r, tuple) else r
    res['parser'][t] = o
    res['filters'][t] = {k: f(t) for k, f in FILTERS.items()}
with open(out, 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=1)
print('token | parser output intact? | ' + ' | '.join(FILTERS))
for t in TOKENS:
    o = res['parser'][t]
    intact = o == f'<p class="{t}">x</p>'
    print(t, '|', 'yes' if intact else 'NO: ' + o, '|', ' | '.join('keep' if v else 'drop' for v in res['filters'][t].values()))
