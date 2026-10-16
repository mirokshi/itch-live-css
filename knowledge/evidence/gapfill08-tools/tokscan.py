# Scan local itch page copies for class tokens containing 'custom' that are NOT plain custom-/custom_ words.
# usage: python -I tokscan.py <list_of_paths.txt>
import re, sys, collections
BS = chr(92)
paths = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
tok = collections.Counter(); where = collections.defaultdict(set); plain = collections.Counter(); pages = 0
seen_hashes = set()
for p in paths:
    try:
        h = open(p, encoding='utf-8', errors='replace').read()
    except Exception:
        continue
    if 'itch.io' not in h:
        continue
    pages += 1
    for m in re.findall(r'class="([^"]*)"', h):
        for t in m.split():
            if 'custom' not in t.lower():
                continue
            if re.fullmatch(r'custom[-_][A-Za-z0-9_-]*', t):
                plain[t[:7]] += 1
                continue
            tok[t] += 1
            where[t].add(p.replace(BS, '/').split('scratchpad/')[-1][:80])
print('itch page copies scanned:', pages, ' plain custom-/custom_ token occurrences:', dict(plain), ' unusual distinct:', len(tok))
for t, c in tok.most_common(80):
    print(c, repr(t), sorted(where[t])[:2])
