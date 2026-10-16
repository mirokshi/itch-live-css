# Build a static, script-free local harness from a curl'd itch page.
# usage: python -I build-harness.py <in.html> <out.html> [old=>new ...]
# Each old=>new pair rewrites a URL (e.g. the static.itch.io stylesheet -> a local copy).
# The separator is "=>" (not "="): itch CDN URLs contain base64 with "==" padding,
# e.g. https://img.itch.zone/aW1nLzMwODAyMjIyLmpwZw==/original/2dSiyI.jpg, and splitting
# on the first "=" silently produced a broken URL (fixed 2026-10-14 during verification).
# Caveat: stripping <script> freezes JS-managed state. Example: #user_tools keeps its
# "hidden" class (itch's user.min.js removes it ~200 ms after load), and thumbnails keep
# data-lazy_src without src. Don't draw conclusions about those elements from the harness.
import re, sys
src, out, *pairs = sys.argv[1:]
s = open(src, encoding='utf8').read()
s = re.sub(r'<script\b.*?</script>', '', s, flags=re.S)          # logged-out render without JS
s = re.sub(r'<meta name="csrf_token"[^>]*>', '', s)               # never keep tokens
for p in pairs:
    if '=>' not in p:
        sys.exit(f'bad pair (expected old=>new): {p}')
    old, new = p.split('=>', 1)
    n = s.count(old)
    if not n:
        print('warning: not found:', old)
    s = s.replace(old, new)
open(out, 'w', encoding='utf8').write(s)
print('wrote', out, len(s), 'chars; scripts left:', s.count('<script'))
