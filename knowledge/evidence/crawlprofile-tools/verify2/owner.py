import re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
t = open(sys.argv[1], encoding="utf-8").read()
i = t.find("init_UserThemeEditor")
print("init at", i)
seg = t[i:i + 40000]
j = seg.find("{")
dec = json.JSONDecoder()
obj, end = dec.raw_decode(seg[j:])
print("call prefix:", seg[:j][:120])
print("keys", list(obj.keys()))
for k, v in obj.items():
    if k not in ("css_template", "theme"):
        print("  ", k, ":", json.dumps(v)[:200])
th = obj.get("theme", {})
print("theme:", {k: (v if k != "css" else "<%d chars>" % len(v)) for k, v in th.items()})
ct = obj.get("css_template", "")
print("template len", len(ct))
print(ct)
