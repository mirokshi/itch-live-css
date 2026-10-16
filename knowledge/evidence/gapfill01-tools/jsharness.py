# Build a JS-ENABLED local harness from a curl'd itch jam overview: keeps every <script>,
# points itch's static bundle (lib/bundle/jam .min.js, jam.css) at local copies in the same folder,
# drops the csrf meta. Run it with CDP_BLOCK_ITCH=1 so images/other itch URLs are never requested.
# usage: python -I jsharness.py <in.html> <out.html>
import re, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf8').read()
s = re.sub(r'<meta name="csrf_token"[^>]*>', '', s)
n = 0
for name in ('lib.min.js', 'bundle.min.js', 'jam.min.js', 'jam.css'):
    s, k = re.subn(r'https://static\.itch\.io/' + re.escape(name) + r'\?\d+', name, s); n += k
open(out, 'w', encoding='utf8').write(s)
print('wrote', out, 'rewrites', n, 'scripts', s.count('<script'))
