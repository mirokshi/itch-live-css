"""Independent query tool for the support verifier.
usage:
  python -I q.py wf <wf data.json> id1,id2,...
  python -I q.py bcd <bcd data.json> key1 key2 ...        (prints full raw support statements, depth 1 children names)
  python -I q.py rel <bcd data.json> browser [n]          (last n releases)
  python -I q.py usage <caniuse.json> agent [n]          (top-n versions by global usage)
  python -I q.py share <caniuse.json>                    (total usage per agent)
"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
mode, path = sys.argv[1], sys.argv[2]
d = json.load(open(path, encoding='utf-8'))
if mode == 'wf':
    for i in sys.argv[3].split(','):
        v = d['features'].get(i)
        if not v:
            print(i, 'MISSING'); continue
        if v.get('kind') != 'feature':
            print(i, 'KIND', v); continue
        s = v['status']
        print(f"{i}: baseline={s.get('baseline')} low={s.get('baseline_low_date')} high={s.get('baseline_high_date')} support={s.get('support')}")
elif mode == 'bcd':
    B = ['chrome', 'chrome_android', 'edge', 'firefox', 'firefox_android', 'safari', 'safari_ios', 'samsunginternet_android']
    for k in sys.argv[3:]:
        n = d
        ok = True
        for p in k.split('.'):
            if p not in n:
                ok = False; break
            n = n[p]
        if not ok:
            print('##', k, 'MISSING'); continue
        c = n.get('__compat')
        print('##', k, 'children:', [x for x in n if x != '__compat'])
        if c:
            print('   status', c.get('status'))
            for b in B:
                e = c['support'].get(b)
                print('  ', b, json.dumps(e, ensure_ascii=False)[:400])
elif mode == 'rel':
    b = sys.argv[3]; n = int(sys.argv[4]) if len(sys.argv) > 4 else 8
    rel = d['browsers'][b]['releases']
    items = sorted(rel.items(), key=lambda kv: (kv[1].get('release_date') or '9999'))
    for k, v in items[-n:]:
        print(b, k, v.get('release_date'), v.get('status'), v.get('engine'), v.get('engine_version'))
elif mode == 'usage':
    a = sys.argv[3]; n = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    ug = d['agents'][a]['usage_global']
    tot = sum(x for x in ug.values() if x)
    print(a, 'total', round(tot, 2))
    for k, v in sorted(ug.items(), key=lambda kv: -(kv[1] or 0))[:n]:
        print('  ', k, v)
elif mode == 'share':
    tot = 0
    for a, v in d['agents'].items():
        s = sum(x for x in v['usage_global'].values() if x)
        tot += s
        print(a, round(s, 2))
    print('TOTAL', round(tot, 2))
