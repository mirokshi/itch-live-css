"""mk.py <page.html> <out-name> <css-file|-> <probe.js> <mode: replace|jam|keep|none>
Verifier's own harness builder: drops <script>, maps static.itch.io bundles to ../raw/<b>.css,
puts the test CSS where itch would (custom_css or inside jam_theme), appends the probe."""
import re, sys, os
page, outname, cssf, probe, mode = sys.argv[1:6]
here = os.path.dirname(os.path.abspath(__file__))
tests = os.path.join(os.environ['WORK'], 'tests')
s = open(page, encoding='utf8').read()
s = re.sub(r'<script\b.*?</script>', '', s, flags=re.S | re.I)
s = re.sub(r'https://static\.itch\.io/(\w+)\.css\?\d+', r'../raw/\1.css', s)
css = '' if cssf == '-' else open(cssf, encoding='utf8').read()
def sub1(pat, fn):
    global s
    s, n = re.subn(pat, fn, s, count=1, flags=re.S)
    assert n == 1, pat
if mode == 'jam':
    sub1(r'(<style[^>]*id="jam_theme"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + m.group(2) + css + m.group(3))
elif mode == 'replace':
    if 'id="custom_css"' in s:
        sub1(r'(<style[^>]*id="custom_css"[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + css + m.group(3))
    else:
        sub1(r'(<style[^>]*id="(?:user|game)_theme"[^>]*>.*?</style>(?:\s*<link[^>]*fonts\.googleapis[^>]*>)?)', lambda m: m.group(1) + '<style type="text/css" id="custom_css">' + css + '</style>')
elif mode == 'none':
    s = re.sub(r'(<style[^>]*id="custom_css"[^>]*>)(.*?)(</style>)', r'\1\3', s, flags=re.S)
p = open(probe, encoding='utf8').read()
s = s.replace('</body>', '<pre id="out"></pre><script>' + p + '</script></body>')
open(os.path.join(tests, outname), 'w', encoding='utf8').write(s)
