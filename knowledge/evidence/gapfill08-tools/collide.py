# Which renamed Bootstrap classes (custom-<bs>) do creators already use as their own custom-* classes?
# usage: python -I collide.py <bs-rename-map.json> <list_of_page_paths.txt>
import json, re, sys, collections
mp = json.load(open(sys.argv[1], encoding='utf-8'))
renamed = {'custom-' + k for k in mp}
paths = [l.strip() for l in open(sys.argv[2], encoding='utf-8') if l.strip()]
done = set(); seen = collections.Counter(); pages_with = collections.defaultdict(set); n = 0
for p in paths:
    try:
        h = open(p, encoding='utf-8', errors='replace').read()
    except Exception:
        continue
    if 'itch.io' not in h or ('user_profile' not in h and 'formatted_description' not in h and 'jam_' not in h):
        continue
    cm = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="canonical"', h)
    key = (cm.group(1) or cm.group(2)) if cm else p
    if key in done:
        continue
    done.add(key)
    n += 1
    toks = set()
    for m in re.findall(r'class="([^"]*)"', h):
        toks |= {t for t in m.split() if re.fullmatch(r'custom-[A-Za-z0-9_-]+', t)}
    for t in toks & renamed:
        seen[t] += 1
        pages_with[t].add(p)
all_custom = set()
print('distinct pages (by canonical URL):', n, '| renamed Bootstrap classes:', len(renamed))
print('renamed names already used by creators:', len(seen))
for t, c in seen.most_common(40):
    print(f'  {t}: {c} distinct pages')
