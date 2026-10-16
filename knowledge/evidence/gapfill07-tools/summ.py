import json, sys, re
# Summarize livegrid results: one line per width/variant per distinct grid class
for path in sys.argv[1:]:
    print('==', path)
    seen_sizer = {}
    for line in open(path, encoding='utf8'):
        m = re.match(r'W(\d+) (\S+) (\{.*\})$', line.strip())
        if not m:
            if line.startswith(('browser', 'custom_css', 'requests')):
                print(line.rstrip()[:200])
            continue
        w, name, js = m.group(1), m.group(2), json.loads(m.group(3))
        key = (w,)
        sz = ' | '.join(js['sizers'])
        if seen_sizer.get(w) != sz:
            print(f'  W{w} vw={js["vw"]} order: {js["styleOrder"]}')
            for s in js['sizers']:
                print('     sizer:', s)
            seen_sizer[w] = sz
        parts = []
        done = set()
        for g in js['grids']:
            k = g['cls'] + g['id']
            if k in done: continue
            done.add(k)
            short = 'user_game_grid' if 'user_game_grid' in g['cls'] else ('browse' if 'browse' in g['cls'] else ('game_list' if 'game_list' in g['cls'] else g['cls'][:30]))
            parts.append(f"[{short}{'#'+g['id'] if g['id'] else ''} {g['display']} cols={g['cols']} cgap={g['colGap']} var={g['gapVar'] or '-'} w={g['w']} ox={g['overflowX']} sw/cw={g['sw']}/{g['cw']} row1={g['row1']}/{g['nCells']} cellW={g['cellW']}]")
        print(f'  W{w} {name:24s} ' + ' '.join(parts))
