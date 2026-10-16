import sys, re, json
h = open(sys.argv[1], encoding="utf-8").read()
i = h.find("init_UserThemeEditor(")
# grab the JSON object argument: find first '{' after the call and balance braces (string aware)
j = h.find("{", i)
depth = 0; k = j; instr = False; esc = False
while k < len(h):
    c = h[k]
    if instr:
        if esc: esc = False
        elif c == "\\": esc = True
        elif c == '"': instr = False
    else:
        if c == '"': instr = True
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0: break
    k += 1
obj = json.loads(h[j:k + 1])
print("top keys:", sorted(obj.keys()))
th = obj.get("theme", {})
print("theme keys:", sorted(th.keys()))
print("theme values (css elided):", {kk: (vv if kk != "css" else f"<{len(vv)} chars>") for kk, vv in th.items()})
tpl = obj.get("css_template", "")
print("css_template length", len(tpl))
print(tpl[:3000])
for kk in ("image_size_limit", "can_use_css", "fonts_url", "css_guide_url"):
    print(kk, obj.get(kk))
for kw in ["edit_theme_btn", "owner_tools", "header_buttons", "theme_editor_columns", "theme_editor_primary_column", "has_header", 'style="display: none"', "purchased_games", "collection_row"]:
    print(kw, h.count(kw))
print("fonts key type", type(obj.get("fonts")).__name__, str(obj.get("fonts"))[:800])
print("games sample", str(obj.get("games"))[:300])
