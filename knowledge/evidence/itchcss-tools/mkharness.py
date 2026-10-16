"""Build a local test page from a downloaded itch page.
usage: mkharness.py <src.html> <out.html> <custom.css|-> <probe.js> [mode]
 - strips all <script> tags (itch runtime) so we see the logged-out, no-JS render
 - rewrites https://static.itch.io/<x>.css?... to ../raw/<x>.css (local copy)
 - mode 'replace': replaces the contents of <style id="custom_css"> (or creates it after the theme style)
 - mode 'jam': appends custom CSS at the end of <style id="jam_theme"> (how itch serves jam CSS)
 - appends <pre id="out"> and the probe script at the end of <body>
"""
import re, sys
src, out, custom, probe = sys.argv[1:5]
mode = sys.argv[5] if len(sys.argv) > 5 else 'replace'
s = open(src, encoding='utf8').read()
s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
s = re.sub(r'https://static\.itch\.io/(\w+)\.css\?\d+', r'../raw/\1.css', s)
css = '' if custom == '-' else open(custom, encoding='utf8').read()
if mode == 'jam':
    s = re.sub(r'(<style id="jam_theme"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + m.group(2) + css + m.group(3), s, count=1, flags=re.S)
elif mode == 'keep':
    pass
else:
    if 'id="custom_css"' in s:
        s = re.sub(r'(<style id="custom_css"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + css + m.group(3), s, count=1, flags=re.S)
    else:
        s = re.sub(r'(<style id="(?:user|game)_theme"[^>]*>.*?</style>)', lambda m: m.group(1) + '<style id="custom_css" type="text/css">' + css + '</style>', s, count=1, flags=re.S)
p = open(probe, encoding='utf8').read()
s = s.replace('</body>', '<pre id="out"></pre><script>' + p + '</script></body>')
open(out, 'w', encoding='utf8').write(s)
