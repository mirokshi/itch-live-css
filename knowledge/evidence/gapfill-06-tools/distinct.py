"""Distinct served custom-CSS sheets across all raw copies (sha1 of the extracted CSS, newest copy per page key)."""
import sys, os, glob, hashlib, collections
sys.path.insert(0, '.')
from scan import custom_css, canon, ptype, analyze
pages = {}
for root in sys.argv[1:]:
    for f in glob.glob(root + '/*.html'):
        d = open(f, 'rb').read(); cs = custom_css(d); k = canon(d)
        if cs is None or not cs.strip() or not k: continue
        if k in pages and os.path.getmtime(pages[k][0]) >= os.path.getmtime(f): continue
        pages[k] = (f, cs)
sheets = {}
for k, (f, cs) in pages.items():
    h = hashlib.sha1(cs.strip()).hexdigest()
    sheets.setdefault(h, []).append(ptype(k))
print('page keys', len(pages), 'distinct sheets', len(sheets))
# type of a sheet: first non-devlog/other type it was served on
def stype(ts):
    for t in ('profile', 'project', 'jam', 'devlog', 'other'):
        if t in ts: return t
print('sheets by type', collections.Counter(stype(t) for t in sheets.values()))
hit = collections.defaultdict(collections.Counter)
for h, ts in sheets.items():
    cs = next(c for k, (f, c) in pages.items() if hashlib.sha1(c.strip()).hexdigest() == h)
    a = analyze(cs)
    for key in ['amp', 'nested', '@property', 'prop_lt', '@layer', '@scope', '@container', '@starting-style', '@view-transition', 'range_mq', ':has', '@supports', '@charset']:
        if a[key]: hit[key][stype(ts)] += 1
for key, c in hit.items():
    print(key, sum(c.values()), dict(c))
