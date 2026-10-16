# Per pattern (.f-NN), print each minifier's declarations for it, so dropped fallbacks are visible.
# usage: python -I fb-table.py <dir> <prefix>
import glob, os, re, sys
d, prefix = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(d, prefix + ".*.css")))
def rules(text):
    out = {}
    for m in re.finditer(r'(@media[^{]*\{)?#wrapper \.(f-\d\d)\{([^}]*)\}', text):
        out.setdefault(m.group(2), []).append(((m.group(1) or '') + m.group(3)))
    return out
data = {os.path.basename(f)[len(prefix)+1:-4]: rules(open(f, encoding='utf-8').read()) for f in files}
keys = sorted({k for v in data.values() for k in v})
for k in keys:
    print('==', k)
    for name, r in data.items():
        print('   %-22s %s' % (name, ' | '.join(r.get(k, ['<MISSING>']))))
