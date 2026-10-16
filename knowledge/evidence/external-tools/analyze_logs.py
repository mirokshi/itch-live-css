# Summarises the lab server logs (log-<port>.jsonl) after a cdp.mjs run.
# Usage: python -I analyze_logs.py <dir-with-logs> [pagePort=8701] [assetPort=8702]
# Prints: request counts per test name (proves "not requested" claims), arrival offsets
# (waterfall, preload scanner), font request mode/Origin, Referer per request kind, and
# the full header set of one cross-site stylesheet request.
import json, os, re, sys
from collections import Counter

D = sys.argv[1]
PA = int(sys.argv[2]) if len(sys.argv) > 2 else 8701
PB = int(sys.argv[3]) if len(sys.argv) > 3 else 8702
recs = []
for port in (PA, PB):
    fn = os.path.join(D, f"log-{port}.jsonl")
    if os.path.exists(fn):
        recs += [json.loads(l) for l in open(fn, encoding="utf-8")]
recs.sort(key=lambda r: r["t"])

def name(r):
    m = re.search(r"[?&](?:n|k)=([^&]+)", r["path"])
    return m.group(1) if m else r["path"]

def first(n):
    return next((r for r in recs if name(r) == n), None)

cnt = Counter(name(r) for r in recs)
print("request counts (0 = never requested):")
for k in ["m_late", "o_sup_false", "o_print", "o_rm", "o_wide", "sc", "w2",
          "v_after_layer_stmt", "v_after_charset", "v_after_fontface", "v_in_media", "v_in_supports", "v_dup", "v_string",
          "bf", "rl"]:
    print(f"  {k:20} {cnt.get(k, 0)}")
print("page loads: bf1", sum(r["path"].startswith("/pages/bf1") for r in recs),
      "rl1", sum(r["path"].startswith("/pages/rl1") for r in recs))
for a, b in (("w1", "w2"), ("w1", "p1"), ("s1", "ps")):
    ra, rb = first(a), first(b)
    if ra and rb:
        print(f"arrival {b} - {a}: {rb['t'] - ra['t']} ms")
for k in ["FA", "FB", "FC", "FS", "FD", "FE"]:
    r = first(k)
    if r:
        print(f"font {k}: port={r['port']} mode={r['mode']} origin={r['origin']} site={r['site']} referer={r['referer']}")
for k in ["r1", "r2", "r3", "r4", "r1img", "r1font", "inline_img", "x1", "x2", "x1img", "x1font"]:
    r = first(k)
    if r:
        print(f"referer {k}: host={r['all'].get('Host')} mode={r['mode']} site={r['site']} origin={r['origin']} referer={r['referer']}")
r = first("r1")
if r:
    print("all headers of the cross-site stylesheet request r1:")
    for h, v in r["all"].items():
        print(f"  {h}: {v}")
