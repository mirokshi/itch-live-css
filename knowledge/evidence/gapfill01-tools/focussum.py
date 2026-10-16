# Summarise jamfocus.mjs output: per region, stops / with ring / hidden; outline styles seen.
import json, sys, collections
for f in sys.argv[1:]:
    d = json.load(open(f, encoding='utf-8'))
    st = [s for s in d['stops'] if not s.get('body')]
    print('==', f.split('/')[-1], 'width', d['width'], 'stops', len(st), 'body-stops', sum(1 for s in d['stops'] if s.get('body')), 'pre', d['pre'])
    reg = collections.OrderedDict()
    for s in st:
        r = reg.setdefault(s['region'], collections.Counter())
        r['stops'] += 1
        ring = (not s['outline'].startswith('none') and not s['outline'].split()[1].startswith('0')) or bool(s['boxShadow'])
        r['ring'] += ring
        r['hidden'] += s['hidden']
        r['iframe'] += s['tag'] == 'iframe'
        r['noname'] += (s.get('name', '') or '').strip() == '' and s['tag'] != 'iframe'
        r['o:' + s['outline'].rsplit(' rgb', 1)[0] + ' ' + ('rgb' + s['outline'].rsplit(' rgb', 1)[1] if ' rgb' in s['outline'] else '')] += 1
    for k, c in reg.items():
        print(f"  {k:12} " + ', '.join(f"{a}={b}" for a, b in c.items()))
    hid = collections.Counter((s['region'], s['tag'] + '.' + s['cls'].split(' ')[0], s.get('name', '')[:25]) for s in st if s['hidden'])
    for k, v in hid.most_common(8): print('   hidden stop', k, 'x', v)
