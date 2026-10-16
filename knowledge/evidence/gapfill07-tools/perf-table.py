"""Average perf.mjs JSON rows over repetitions and print a Markdown table.
usage: python -I perf-table.py <rows.txt> [<rows.txt> ...]"""
import json, sys
from collections import defaultdict

acc = defaultdict(list)
for path in sys.argv[1:]:
    for line in open(path, encoding='utf8'):
        line = line.strip()
        if not line.startswith('{'):
            continue
        r = json.loads(line)
        acc[(r['name'], r['scenario'], r.get('cpu', 4))].append(r)

def avg(rows, key, sub=None):
    vals = [(r[sub].get(key, 0) if sub else r.get(key, 0)) for r in rows]
    return sum(vals) / len(vals)

print('| Config | Scenario | CPU | n | FPS | frames >50 ms (3 s) | layout ms/s | style ms/s | paint ms/s | display ms/s | GPU pass ms/s |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for (name, scen, cpu), rows in sorted(acc.items(), key=lambda k: (int(k[0][0].split()[0][1:]) + (100 if k[0][0][0] == 'F' else 0), k[0][1], k[0][2])):
    print(f"| {name} | {scen} | {cpu}x | {len(rows)} | {avg(rows,'fps'):.0f} | {avg(rows,'longFrames'):.0f} | "
          f"{avg(rows,'layout','msPerSec'):.0f} | {avg(rows,'style','msPerSec'):.0f} | {avg(rows,'paint','msPerSec'):.0f} | "
          f"{avg(rows,'display','msPerSec'):.0f} | {avg(rows,'gpuPass','msPerSec'):.0f} |")
