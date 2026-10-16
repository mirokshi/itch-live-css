# Remove every @media (prefers-reduced-motion:reduce){...} block from a harness page and from a local CSS copy,
# so v2-motion.mjs can measure a candidate reduced-motion block on its own.
# usage: python -I v-strip-motion.py <in.html> <out.html> [<in.css> <out.css>]
import re, sys
RX = r'@media \(prefers-reduced-motion:\s*reduce\)\{[^{}]*\{[^}]*\}(?:[^{}]*\{[^}]*\})*\}'
a = sys.argv[1:]
for i in range(0, len(a), 2):
    s = open(a[i], encoding='utf8').read(); n = len(re.findall(RX, s)); s = re.sub(RX, '', s)
    open(a[i + 1], 'w', encoding='utf8').write(s); print(a[i + 1], 'removed', n, 'left', s.count('prefers-reduced-motion'))
