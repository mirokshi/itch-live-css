"""build.py <src.html> <out.html> <css-file|-> <probe.js> [replace|jam|keep|none]
Strips <script>, points static.itch.io bundles at ../raw/<name>.css, injects test CSS, appends probe."""
import re, sys
src, out, cssf, probe = sys.argv[1:5]
mode = sys.argv[5] if len(sys.argv) > 5 else 'replace'
s = open(src, encoding='utf8').read()
s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S | re.I)
s = re.sub(r'https://static\.itch\.io/(\w+)\.css\?\d+', r'../raw/\1.css', s)
css = '' if cssf == '-' else open(cssf, encoding='utf8').read()
if mode == 'jam':
    s, n = re.subn(r'(<style id="jam_theme"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + m.group(2) + '\n' + css + m.group(3), s, count=1, flags=re.S)
    assert n == 1
elif mode == 'replace':
    if 'id="custom_css"' in s:
        s, n = re.subn(r'(<style id="custom_css"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + css + m.group(3), s, count=1, flags=re.S)
    else:
        s, n = re.subn(r'(<style id="(?:user|game)_theme"[^>]*>.*?</style>)', lambda m: m.group(1) + '<style id="custom_css">' + css + '</style>', s, count=1, flags=re.S)
    assert n == 1
p = open(probe, encoding='utf8').read()
s = s.replace('</body>', '<pre id="out"></pre><script>' + p + '</script></body>')
open(out, 'w', encoding='utf8').write(s)
