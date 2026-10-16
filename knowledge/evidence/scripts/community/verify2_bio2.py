"""Compare a profile bio as authored (source HTML file) with the bio itch serves.
Usage: python -I -X utf8 bio2.py served_page.html source_bio.html
Prints counts only (classes, style attributes, img attributes, link attributes), no content.
"""
import re, sys
from collections import Counter

page = open(sys.argv[1], encoding='utf-8').read()
src = open(sys.argv[2], encoding='utf-8').read()

# served bio: inner HTML of the element whose class list contains user_profile + formatted
m = re.search(r'<div class="[^"]*\buser_profile\b[^"]*\bformatted\b[^"]*"[^>]*>', page)
start = m.end()
# naive balanced-div walk
depth, i = 1, start
for t in re.finditer(r'<(/?)div\b[^>]*>', page[start:]):
    depth += -1 if t.group(1) else 1
    if depth == 0:
        i = start + t.start(); break
served = page[start:i]

def stats(h, label):
    classes = Counter(c for v in re.findall(r'class="([^"]*)"', h) for c in v.split())
    styles = re.findall(r'style="([^"]*)"', h)
    props = Counter(p.split(':')[0].strip().lower() for s in styles for p in s.split(';') if ':' in p)
    imgs = re.findall(r'<img\b[^>]*>', h)
    links = re.findall(r'<a\b[^>]*>', h)
    print(f'== {label}: chars={len(h)}')
    print('   distinct classes:', len(classes), ' custom* (no hyphen req):', sum(1 for c in classes if c.startswith('custom')),
          ' non-custom:', sorted(c for c in classes if not c.startswith('custom')))
    print('   style attrs:', len(styles), ' props:', dict(props), ' trailing ;:', sum(1 for s in styles if s.strip().endswith(';')))
    print('   imgs:', len(imgs), ' loading=lazy:', sum('loading="lazy"' in x for x in imgs), ' alt=:', sum(' alt=' in x for x in imgs))
    ext = [x for x in links if 'target="_blank"' in x]
    print('   <a>:', len(links), ' target=_blank:', len(ext), ' with rel=nofollow noopener:',
          sum('rel="nofollow noopener"' in x for x in links), ' with referrerpolicy:', sum('referrerpolicy=' in x for x in links))
    hosts = Counter(re.sub(r'^https?://([^/"]+).*', r'\1', re.search(r'href="([^"]*)"', x).group(1)).split('.')[-2] if re.search(r'href="([^"]*)"', x) else '?'
                    for x in links if 'referrerpolicy=' in x)
    hosts_no = Counter(re.sub(r'^https?://([^/"]+).*', r'\1', re.search(r'href="([^"]*)"', x).group(1)).split('.')[-2] if re.search(r'href="([^"]*)"', x) else '?'
                    for x in links if 'referrerpolicy=' not in x)
    print('   referrerpolicy by 2nd-level domain:', dict(hosts), ' without:', dict(hosts_no))
    return classes

a = stats(src, 'source')
b = stats(served, 'served')
print('classes in source but missing in served:', sorted(set(a) - set(b)))
